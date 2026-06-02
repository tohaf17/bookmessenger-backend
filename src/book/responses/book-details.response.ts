import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserBookResponse } from '../../userBook/responses/user-book.response';
import { Book } from '../book.entity';
import { BookResponse } from './book.response';
import { UserBook } from '../../userBook/userBook.entity';

export class BookDetailsResponse {
  @ApiProperty({ type: BookResponse })
  book!: BookResponse;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty()
  commentsCount!: number;

  @ApiProperty()
  averageRating!: number;

  @ApiPropertyOptional({ type: UserBookResponse, nullable: true })
  currentUserBook?: UserBookResponse | null;

  constructor(data: {
    book: Book;
    reviewsCount: number;
    commentsCount: number;
    averageRating: number;
    currentUserBook?: UserBook | null;
  }) {
    this.book = new BookResponse(data.book);
    this.reviewsCount = data.reviewsCount;
    this.commentsCount = data.commentsCount;
    this.averageRating = data.averageRating;
    this.currentUserBook = data.currentUserBook
      ? new UserBookResponse(data.currentUserBook)
      : null;
  }
}
