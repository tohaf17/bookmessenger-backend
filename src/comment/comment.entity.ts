import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Tree, TreeParent, TreeChildren,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';

@Entity()
@Tree("materialized-path")
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  bookId!: number;

  @ManyToOne(() => Book, (book) => book.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Column()
  text!: string;

  @Column()
  createdAt!: Date;

  @TreeParent()
  parent!: Comment;

  @TreeChildren()
  replies!: Comment[];
}
