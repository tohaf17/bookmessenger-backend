import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  bookId!: number;

  @ManyToOne(() => Book, (book) => book.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Column()
  rating!: number;

  @Column()
  text!: string;


  @Column({ default: 0 })
  likesCount!: number;

  @Column({ default: 0 })
  dislikesCount!: number;

  @Column()
  createdAt!: Date;
}
