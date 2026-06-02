import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { RolesGuard } from '../auth/roles.guard';
import { Review } from '../review/review.entity';
import { Comment } from '../comment/comment.entity';
import { UserBook } from '../userBook/userBook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Review, Comment, UserBook])],
  controllers: [BookController],
  providers: [BookService, RolesGuard],
  exports: [BookService],
})
export class BookModule {}
