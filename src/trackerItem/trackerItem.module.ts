import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackerItem } from './trackerItem.entity';
import { TrackerItemController } from './trackerItem.controller';
import { TrackerItemService } from './trackerItem.service';
import { Tracker } from '../tracker/tracker.entity';
import { UserBook } from '../userBook/userBook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrackerItem, Tracker, UserBook])],
  controllers: [TrackerItemController],
  providers: [TrackerItemService],
  exports: [TrackerItemService],
})
export class TrackerItemModule {}
