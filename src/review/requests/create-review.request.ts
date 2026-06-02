import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class CreateReviewRequest {
  @ApiProperty()
  @IsInt()
  bookId!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty()
  @IsString()
  text!: string;
}
