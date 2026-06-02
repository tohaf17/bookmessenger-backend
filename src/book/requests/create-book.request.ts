import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookRequest {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty()
  @IsString()
  authorName!: string;

  @ApiProperty()
  @IsString()
  genre!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  totalPages?: number;
}
