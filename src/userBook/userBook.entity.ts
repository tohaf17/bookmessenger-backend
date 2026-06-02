import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { TrackerItem } from '../trackerItem/trackerItem.entity';

@Index(['userId', 'bookId'], { unique: true })
@Entity()
export class UserBook {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.userBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  bookId!: number;

  @ManyToOne(() => Book, (book) => book.userBooks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book!: Book;

  @Column()
  status!: 'wantToRead' | 'currentlyReading' | 'read';

  @Column({ nullable: true })
  readPages?: number;

  @Column()
  createdAt!: Date;

  @OneToMany(() => TrackerItem, (trackerItem) => trackerItem.userBook)
  trackerItems!: TrackerItem[];
}
