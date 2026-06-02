import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MailModule } from '../mail/mail.module';
import { RolesGuard } from '../auth/roles.guard';
import { UserBook } from '../userBook/userBook.entity';
import { Review } from '../review/review.entity';
import { Comment } from '../comment/comment.entity';
import { Tracker } from '../tracker/tracker.entity';
import { TrackerItem } from '../trackerItem/trackerItem.entity';
@Module({
  imports: [TypeOrmModule.forFeature([User, UserBook, Review, Comment, Tracker, TrackerItem]), MailModule],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
