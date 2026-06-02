import { ApiProperty } from '@nestjs/swagger';
import { Tracker } from '../tracker.entity';

export class TrackerResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  targetBooksCount!: number;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  constructor(tracker: Tracker) {
    this.id = tracker.id;
    this.userId = tracker.userId;
    this.targetBooksCount = tracker.targetBooksCount;
    this.startDate = tracker.startDate;
    this.endDate = tracker.endDate;
  }
}
