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
  createdAt!: Date;

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
    this.createdAt = review.createdAt;
    if (review.user) {
      this.user = {
        id: review.user.id,
        name: review.user.name,
        surname: review.user.surname,
      };
    }
  }
}
