import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, Min } from 'class-validator';

export class CreateTrackerRequest {
  @ApiProperty()
  @IsInt()
  @Min(1)
  targetBooksCount!: number;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}
