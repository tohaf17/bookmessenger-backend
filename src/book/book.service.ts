import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {createClient} from 'redis';
import { DataSource, IsNull, Repository } from 'typeorm';
import {Comment} from '../comment/comment.entity';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { Book } from './book.entity';
import { BookFilterStrategy } from './filters/book-filter-strategy';
import { BookAuthorFilterStrategy } from './filters/book-author-filter.strategy';
import { BookGenreFilterStrategy } from './filters/book-genre-filter.strategy';
import { BookSearchFilterStrategy } from './filters/book-search-filter.strategy';
import { BookQueryRequest } from './requests/book-query.request';
import { CreateBookRequest } from './requests/create-book.request';
import { UpdateBookRequest } from './requests/update-book.request';
import { BookDetailsResponse } from './responses/book-details.response';
import { BookResponse } from './responses/book.response';
import { GoogleBookResponse } from './responses/google-book.response';
import { Review } from '../review/review.entity';
import { UserBook } from '../userBook/userBook.entity';
import {AnalyticsBookResponse} from './responses/analytics-book.response';
import { RedisClientType } from 'redis';

type GoogleBooksVolumeInfo = {
  title?: string;
  authors?: string[];
  categories?: string[];
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  pageCount?: number;
  industryIdentifiers?: Array<{
    type: string;
    identifier: string;
  }>;
};


type GoogleBooksVolume = {
  volumeInfo?: GoogleBooksVolumeInfo;
};

type GoogleBooksSearchResponse = {
  items?: GoogleBooksVolume[];
  totalItems?: number;
};
type Details={
  reviewsCount: number,
      averageRating: number,
      commentsCount: number,
      readRightNowCount: number,
      wantToReadCount: number,
      alreadyReadCount: number,
}

@Injectable()
export class BookService {
  private readonly filterStrategies: BookFilterStrategy[] = [
    new BookSearchFilterStrategy(),
    new BookGenreFilterStrategy(),
    new BookAuthorFilterStrategy(),
  ];
  private readonly cacheTTL:number = 3600;
  private readonly redisClient: RedisClientType;

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
    private readonly dataSource: DataSource,
  ) {
    this.redisClient = createClient({
      url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    });
    this.redisClient.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  async findDetails(id: number, userId: number): Promise<BookDetailsResponse> {
    const book = await this.findBookEntity(id);
    const cacheKey = `book:${id}:details-counters`;
    let counters: Details | null = null;

    try {
      const cached = await this.redisClient.get(cacheKey);
      if (cached) counters = JSON.parse(cached);
    } catch (err) {
      console.error('Redis error:', err);
    }

    if (!counters) {
      counters = await this.getDetailsCountersFromDB(id);
      try {
        await this.redisClient.set(cacheKey, JSON.stringify(counters), { EX: this.cacheTTL });
      } catch (err) {
        console.error('Redis save error:', err);
      }
    }

    const currentUserBook = await this.userBookRepository.findOne({ where: { bookId: id, userId } });

    return new BookDetailsResponse({ 
      book, 
      reviewsCount: counters!.reviewsCount,
      averageRating: counters!.averageRating,
      commentsCount: counters!.commentsCount,
      readRightNowCount: counters!.readRightNowCount,
      wantToReadCount: counters!.wantToReadCount,
      alreadyReadCount: counters!.alreadyReadCount,
      currentUserBook 
    });
  }

  async invalidateBookCache(bookId: number): Promise<void> {
    const cacheKey = `book:${bookId}:details-counters`;
    try {
      await this.redisClient.del(cacheKey);
    } catch (err) {
      console.error(`Failed to invalidate cache for book ${bookId}:`, err);
    }
  }

  async create(data: CreateBookRequest): Promise<BookResponse> {
    const coverImageUrl =
      data.coverImageUrl ?? (await this.findCoverByTitle(data.title)) ?? '';

    const book = this.bookRepository.create({
      ...data,
      coverImageUrl,
      createdAt: new Date(),
    });

    await this.bookRepository.save(book);
    return new BookResponse(await this.findBookEntity(book.id));
  }

  async findAll(
    params: BookQueryRequest,
  ): Promise<PaginatedResponse<BookResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const queryBuilder = this.bookRepository
      .createQueryBuilder('book')
      .take(quantity)
      .skip(skip)
      .orderBy('book.id', 'DESC');

    for (const strategy of this.filterStrategies) {
      strategy.apply(queryBuilder, params);
    }

    const [books, booksCount] = await queryBuilder.getManyAndCount();

    return {
      data: books.map((book) => new BookResponse(book)),
      pagination: {
        totalItems: booksCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(booksCount / quantity),
      },
    };
  }

  async findOne(id: number): Promise<BookResponse> {
    const book = await this.findBookEntity(id);
    return new BookResponse(book);
  }

  

  async update(id: number, data: UpdateBookRequest): Promise<BookResponse> {
    const book = await this.findBookEntity(id);
    Object.assign(book, data);
    await this.bookRepository.save(book);
    return new BookResponse(await this.findBookEntity(id));
  }

  async remove(id: number): Promise<BookResponse> {
    const book = await this.findBookEntity(id);
    await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const reviewRepo = manager.getRepository(Review);
      const userBookRepo = manager.getRepository(UserBook);
      const bookRepo = manager.getRepository(Book);

      const rootComments = await commentRepo.find({
        where: { bookId: id, parent: IsNull() },
        relations: { replies: true },
      });

      for (const comment of rootComments) {
        await this.removeCommentTree(comment, commentRepo);
      }

      await reviewRepo.delete({ bookId: id });
      await userBookRepo.delete({ bookId: id });
      await bookRepo.delete({ id });
    });
    await this.invalidateBookCache(id);
    return new BookResponse(book);
  }

  async searchGoogleBooks(
    query: string,
    page = 1,
    quantity = 10,
  ): Promise<{ items: GoogleBookResponse[]; totalItems: number }> {
    const startIndex = (page - 1) * quantity;
    const data = await this.searchGoogleBooksApi(query, quantity, startIndex);

    const volumes = data.items ?? [];
    const mapped = volumes
      .filter((volume) => volume.volumeInfo?.title)
      .map((volume): GoogleBookResponse => {
        const volumeInfo = volume.volumeInfo!;
        return {
          googleBooksId: volumeInfo.industryIdentifiers?.[0]?.identifier ?? '',
          title: volumeInfo.title ?? '',
          authorName: volumeInfo.authors?.join(', ') || 'Unknown',
          genre: volumeInfo.categories?.[0] || '',
          description: volumeInfo.description ?? '',
          coverImageUrl: volumeInfo.imageLinks?.thumbnail ?? '',
          totalPages: volumeInfo.pageCount,
        };
      });

    return { items: mapped, totalItems: data.totalItems ?? mapped.length };
  }

  async getAllGenres(): Promise<string[]> {
    const genres = await this.bookRepository
      .createQueryBuilder('book')
      .select('DISTINCT book.genre', 'genre')
      .where('book.genre IS NOT NULL AND book.genre != :empty', { empty: '' })
      .orderBy('genre', 'ASC')
      .getRawMany<{ genre: string }>();

    return genres.map((g) => g.genre).filter(Boolean);
  }

  private async findCoverByTitle(title: string): Promise<string | null> {
    const volumes = await this.searchGoogleBooksApi(title, 1);
    const thumbnail = volumes[0]?.volumeInfo?.imageLinks?.thumbnail;
    return thumbnail || null;
  }
  

  private async searchGoogleBooksApi(
    query: string,
    limit: number,
    startIndex = 0,
  ): Promise<GoogleBooksSearchResponse> {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      if (!apiKey) {
        console.warn('GOOGLE_BOOKS_API_KEY is not set. Some features may not work.');
        return { items: [], totalItems: 0 };
      }

      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&startIndex=${startIndex}&maxResults=${Math.min(limit, 40)}&key=${apiKey}`;
      
      const { data } = await axios.get<GoogleBooksSearchResponse>(url);
      return data ?? { items: [], totalItems: 0 };
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching data from Google Books API:', error.message);
      } else {
        console.error('Error fetching data from Google Books API:', error);
      }
      return { items: [], totalItems: 0 };
    }
  }

  private async findBookEntity(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return book;
  }

  private async removeCommentTree(
    comment: Comment,
    commentRepository: Repository<Comment>,
  ): Promise<void> {
    const children = await commentRepository
      .createQueryBuilder('comment')
      .where('comment.parentId = :id', { id: comment.id })
      .getMany();

    for (const child of children) {
      await this.removeCommentTree(child, commentRepository);
    }

    await commentRepository.remove(comment);
  }

  private async getDetailsCountersFromDB(bookId: number): Promise<Details> {
    const [reviewsAndRating, commentsCount, userBookStats] = await Promise.all([
      this.reviewRepository
        .createQueryBuilder('review')
        .select('COUNT(review.id)', 'count')
        .addSelect('COALESCE(AVG(review.rating), 0)', 'averageRating')
        .where('review.bookId = :bookId', { bookId })
        .getRawOne<{ count: string; averageRating: string }>(),

      this.commentRepository.count({ where: { bookId } }),

      this.userBookRepository
        .createQueryBuilder('ub')
        .select("COUNT(CASE WHEN ub.status = 'currentlyReading' THEN 1 END)", 'reading')
        .addSelect("COUNT(CASE WHEN ub.status = 'wantToRead' THEN 1 END)", 'want')
        .addSelect("COUNT(CASE WHEN ub.status = 'read' THEN 1 END)", 'read')
        .where('ub.bookId = :bookId', { bookId })
        .getRawOne<{ reading: string; want: string; read: string }>(),
    ]);

    return {
      reviewsCount: Number(reviewsAndRating?.count ?? 0),
      averageRating: Number(reviewsAndRating?.averageRating ?? 0),
      commentsCount: Number(commentsCount),
      readRightNowCount: Number(userBookStats?.reading ?? 0),
      wantToReadCount: Number(userBookStats?.want ?? 0),
      alreadyReadCount: Number(userBookStats?.read ?? 0),
    };
  }
}
