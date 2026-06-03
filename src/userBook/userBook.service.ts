import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { Tracker } from '../tracker/tracker.entity';
import { TrackerItem } from '../trackerItem/trackerItem.entity';
import { CreateUserBookRequest } from './requests/create-user-book.request';
import { UpdateUserBookRequest } from './requests/update-user-book.request';
import { UserBookQueryRequest } from './requests/user-book-query.request';
import { UserBookResponse } from './responses/user-book.response';
import { UserBook } from './userBook.entity';
import { UserBookStatus } from './requests/create-user-book.request';
import { BookService } from '../book/book.service';

@Injectable()
export class UserBookService {
  constructor(
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    @InjectRepository(TrackerItem)
    private readonly trackerItemRepository: Repository<TrackerItem>,
    private readonly bookService: BookService,
  ) {}

  async create(
    data: CreateUserBookRequest,
    userId: number,
  ): Promise<UserBookResponse> {
    const userBook = this.userBookRepository.create({
      ...data,
      userId,
      createdAt: new Date(),
    });

    await this.userBookRepository.save(userBook);
    await this.addToTrackerIfRead(userBook);

    return new UserBookResponse(await this.findUserBookEntity(userBook.id, userId));
  }

  async findAll(
    params: UserBookQueryRequest,
    userId: number,
  ): Promise<PaginatedResponse<UserBookResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const where: Partial<UserBook> = { userId };

    if (params.status) {
      where.status = params.status;
    }

    const [userBooks, userBooksCount] =
      await this.userBookRepository.findAndCount({
        where,
        relations: { book: true },
        take: quantity,
        skip,
        order: { id: 'DESC' },
      });

    return {
      data: userBooks.map((userBook) => new UserBookResponse(userBook)),
      pagination: {
        totalItems: userBooksCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(userBooksCount / quantity),
      },
    };
  }

  async findOne(id: number, userId: number): Promise<UserBookResponse> {
    const userBook = await this.findUserBookEntity(id, userId);
    return new UserBookResponse(userBook);
  }

  async findByBook(
    bookId: number,
    userId: number,
  ): Promise<UserBookResponse | null> {
    const userBook = await this.userBookRepository.findOne({
      where: { bookId, userId },
      relations: { book: true },
    });

    return userBook ? new UserBookResponse(userBook) : null;
  }

  async update(
    id: number,
    data: UpdateUserBookRequest,
    userId: number,
  ): Promise<UserBookResponse> {
    const userBook = await this.findUserBookEntity(id, userId);
    Object.assign(userBook, data);
    await this.userBookRepository.save(userBook);

    await this.addToTrackerIfRead(userBook);

    return new UserBookResponse(await this.findUserBookEntity(id, userId));
  }

  async remove(id: number, userId: number): Promise<UserBookResponse> {
    const userBook = await this.findUserBookEntity(id, userId);
    await this.removeBeforeUserBookDelete(userBook.id, userId);
    await this.userBookRepository.remove(userBook);
    await this.invalidateBookAnalytics(userBook.bookId);
    return new UserBookResponse(userBook);
  }

  private async findUserBookEntity(
    id: number,
    userId: number,
  ): Promise<UserBook> {
    const userBook = await this.userBookRepository.findOne({
      where: { id, userId },
      relations: { book: true },
    });

    if (!userBook) {
      throw new NotFoundException(`User book with id ${id} not found`);
    }

    return userBook;
  }

  private async addToTrackerIfRead(userBook: UserBook): Promise<void> {
    const [tracker] = await Promise.all([
      this.trackerRepository.findOne({ where: { userId: userBook.userId } }),
      this.invalidateBookAnalytics(userBook.bookId),
    ]);

    if (!tracker) return;

    const existingTrackerItem = await this.trackerItemRepository.findOne({
      where: { trackerId: tracker.id, userBookId: userBook.id },
    });

    if (userBook.status === UserBookStatus.Read) {
      await this.handleStatusRead(tracker.id, userBook.id, existingTrackerItem);
    } else {
      await this.handleStatusUnread(existingTrackerItem);
    }
  }

  private async handleStatusRead(
    trackerId: number,
    userBookId: number,
    existingItem: TrackerItem | null,
  ): Promise<void> {
    if (!existingItem) {
      const newItem = this.trackerItemRepository.create({
        trackerId,
        userBookId,
      });
      await this.trackerItemRepository.save(newItem);
    }
  }

  private async handleStatusUnread(
    existingItem: TrackerItem | null,
  ): Promise<void> {
    if (existingItem) {
      await this.trackerItemRepository.remove(existingItem);
    }
  }

  private async invalidateBookAnalytics(bookId: number): Promise<void> {
    try {
      await this.bookService.invalidateBookCache(bookId);
    } catch (err) {
      console.error(`Failed to clear analytics cache for book ${bookId}:`, err);
    }
  }

  private async removeBeforeUserBookDelete(userBookId: number, userId: number): Promise<void> {
    const tracker = await this.trackerRepository.findOne({
      where: { userId },
    });

    if (tracker) {
      const existingTrackerItem = await this.trackerItemRepository.findOne({
        where: { trackerId: tracker.id, userBookId },
      });
      if (existingTrackerItem) {
        await this.trackerItemRepository.remove(existingTrackerItem);
      }
    }
  }
}
