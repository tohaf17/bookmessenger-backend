import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserBook } from '../userBook.entity';
import { UserBookStatus } from '../requests/create-user-book.request';
import {Book} from '../../book/book.entity';

export class UserBookResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  bookId!: number;

  @ApiProperty({ enum: UserBookStatus })
  status!: UserBook['status'];

  @ApiPropertyOptional()
  readPages?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  book?: Book;

  constructor(userBook: UserBook) {
    this.id = userBook.id;
    this.userId = userBook.userId;
    this.bookId = userBook.bookId;
    this.status = userBook.status;
    this.readPages = userBook.readPages;
    this.createdAt = userBook.createdAt;
    this.book = userBook.book;
  }
}
