import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class CreateTrackerItemRequest {
  @ApiProperty()
  @IsInt()
  trackerId!: number;

  @ApiProperty()
  @IsInt()
  userBookId!: number;
}
