import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateCommentRequest {
  @ApiProperty()
  @IsInt()
  bookId!: number;

  @ApiProperty()
  @IsString()
  text!: string;
}
