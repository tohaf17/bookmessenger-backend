import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tracker } from '../tracker/tracker.entity';
import { UserBook } from '../userBook/userBook.entity';

@Index(['trackerId', 'userBookId'], { unique: true })
@Entity()
export class TrackerItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  trackerId!: number;

  @ManyToOne(() => Tracker, (tracker) => tracker.trackerItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trackerId' })
  tracker!: Tracker;

  @Column()
  userBookId!: number;

  @ManyToOne(() => UserBook, (userBook) => userBook.trackerItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userBookId' })
  userBook!: UserBook;
}
