import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBook } from './userBook.entity';
import { UserBookController } from './userBook.controller';
import { UserBookService } from './userBook.service';
import { Tracker } from '../tracker/tracker.entity';
import { TrackerItem } from '../trackerItem/trackerItem.entity';
import { MeController } from '../me/me.controller';
import { BookModule } from '../book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserBook, Tracker, TrackerItem]),BookModule],
  controllers: [UserBookController, MeController],
  providers: [UserBookService],
  exports: [UserBookService],
})
export class UserBookModule {}
