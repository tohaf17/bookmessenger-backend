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
import { TrackerItem } from '../trackerItem/trackerItem.entity';

@Entity()
@Index(['userId'], { unique: true })
export class Tracker {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => User, (user) => user.trackers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @OneToMany(() => TrackerItem, (trackerItem) => trackerItem.tracker)
  trackerItems!: TrackerItem[];

  @Column()
  targetBooksCount!: number;

  @Column()
  startDate!: Date;

  @Column()
  endDate!: Date;
}
