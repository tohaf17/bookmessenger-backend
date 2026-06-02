import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleBookResponse {
  @ApiProperty()
  googleBooksId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  authorName!: string;

  @ApiPropertyOptional()
  genre?: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  coverImageUrl!: string;

  @ApiPropertyOptional()
  totalPages?: number;
}
