import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackerItem } from '../trackerItem.entity';
import { UserBook } from '../../userBook/userBook.entity';

export class TrackerItemResponse {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  trackerId!: number;

  @ApiProperty()
  userBookId!: number;

  @ApiPropertyOptional()
  userBook?: UserBook;

  constructor(trackerItem: TrackerItem) {
    this.id = trackerItem.id;
    this.trackerId = trackerItem.trackerId;
    this.userBookId = trackerItem.userBookId;
    this.userBook = trackerItem.userBook;
  }
}
