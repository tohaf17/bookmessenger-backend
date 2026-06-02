import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Book } from '../book.entity';

export class BookResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  authorName!: string;

  @ApiProperty()
  genre!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  coverImageUrl!: string;

  @ApiPropertyOptional()
  totalPages?: number;

  @ApiProperty()
  createdAt!: Date;

  constructor(book: Book) {
    this.id = book.id;
    this.title = book.title;
    this.authorName = book.authorName;
    this.genre = book.genre;
    this.description = book.description;
    this.coverImageUrl = book.coverImageUrl;
    this.totalPages = book.totalPages;
    this.createdAt = book.createdAt;
  }
}
