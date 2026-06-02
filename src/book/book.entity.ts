import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Review } from '../review/review.entity';
import { Comment } from '../comment/comment.entity';
import { UserBook } from '../userBook/userBook.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column()
  authorName!: string;

  @Column()
  genre!: string;

  @Column()
  description!: string;

  @Column()
  coverImageUrl!: string;

  @Column({ nullable: true })
  totalPages?: number;

  @Column()
  createdAt!: Date;

  @OneToMany(() => Review, (review) => review.book)
  reviews!: Review[];

  @OneToMany(() => Comment, (comment) => comment.book)
  comments!: Comment[];

  @OneToMany(() => UserBook, (userBook) => userBook.book)
  userBooks!: UserBook[];
}
