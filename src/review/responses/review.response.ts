import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review } from '../review.entity';

export class ReviewResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  bookId!: number;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  likesCount!: number;

  @ApiProperty()
  dislikesCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  book?: {
    id: number;
    title: string;
    authorName: string;
  };

  @ApiPropertyOptional()
  user?: {
    id: number;
    name: string;
    surname: string;
  };

  constructor(review: Review) {
    this.id = review.id;
    this.userId = review.userId;
    this.bookId = review.bookId;
    this.rating = review.rating;
    this.content = review.text;
    this.likesCount = review.likesCount ?? 0;
    this.dislikesCount = review.dislikesCount ?? 0;
    this.createdAt = review.createdAt;
    if (review.book) {
      this.book = {
        id: review.book.id,
        title: review.book.title,
        authorName: review.book.authorName,
      };
    }
    if (review.user) {
      this.user = {
        id: review.user.id,
        name: review.user.name,
        surname: review.user.surname,
      };
    }
  }
}
