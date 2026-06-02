import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { Comment } from '../comment/comment.entity';
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

@Injectable()
export class BookService {
  private readonly filterStrategies: BookFilterStrategy[] = [
    new BookSearchFilterStrategy(),
    new BookGenreFilterStrategy(),
    new BookAuthorFilterStrategy(),
  ];

  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
  ) {}

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

  async findDetails(id: number, userId: number): Promise<BookDetailsResponse> {
    const book = await this.findBookEntity(id);

    const [reviewsCount, commentsCount, ratingRaw, currentUserBook] =
      await Promise.all([
        this.reviewRepository.count({ where: { bookId: id } }),
        this.commentRepository.count({ where: { bookId: id } }),
        this.reviewRepository
          .createQueryBuilder('review')
          .select('COALESCE(AVG(review.rating), 0)', 'averageRating')
          .where('review.bookId = :bookId', { bookId: id })
          .getRawOne<{ averageRating: string }>(),
        this.userBookRepository.findOne({
          where: { bookId: id, userId },
        }),
      ]);

    return new BookDetailsResponse({
      book,
      reviewsCount,
      commentsCount,
      averageRating: Number(ratingRaw?.averageRating ?? 0),
      currentUserBook,
    });
  }

  async update(id: number, data: UpdateBookRequest): Promise<BookResponse> {
    const book = await this.findBookEntity(id);
    Object.assign(book, data);
    await this.bookRepository.save(book);
    return new BookResponse(await this.findBookEntity(id));
  }

  async remove(id: number): Promise<BookResponse> {
    const book = await this.findBookEntity(id);
    await this.bookRepository.remove(book);
    return new BookResponse(book);
  }

  async searchGoogleBooks(query: string): Promise<GoogleBookResponse[]> {
    const volumes = await this.searchGoogleBooksApi(query, 10);

    return volumes
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
  }

  private async findCoverByTitle(title: string): Promise<string | null> {
    const volumes = await this.searchGoogleBooksApi(title, 1);
    const thumbnail = volumes[0]?.volumeInfo?.imageLinks?.thumbnail;
    return thumbnail || null;
  }

  private async searchGoogleBooksApi(
    query: string,
    limit: number,
  ): Promise<GoogleBooksVolume[]> {
    try {
      const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
      if (!apiKey) {
        console.warn('GOOGLE_BOOKS_API_KEY is not set. Some features may not work.');
        return [];
      }

      const encodedQuery = encodeURIComponent(query);
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${Math.min(limit, 40)}&key=${apiKey}`;
      
      const { data } = await axios.get<GoogleBooksSearchResponse>(url);
      return data.items ?? [];
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching data from Google Books API:', error.message);
      } else {
        console.error('Error fetching data from Google Books API:', error);
      }
      return [];
    }
  }

  private async findBookEntity(id: number): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }

    return book;
  }
}
