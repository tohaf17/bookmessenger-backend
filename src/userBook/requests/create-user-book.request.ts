import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum UserBookStatus {
  WantToRead = 'wantToRead',
  CurrentlyReading = 'currentlyReading',
  Read = 'read',
}

export class CreateUserBookRequest {
  @ApiProperty()
  @IsInt()
  bookId!: number;

  @ApiProperty({ enum: UserBookStatus })
  @IsEnum(UserBookStatus)
  status!: UserBookStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  readPages?: number;
}
