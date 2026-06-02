import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { Review } from '../review/review.entity';
import { Comment } from '../comment/comment.entity';
import { Tracker } from '../tracker/tracker.entity';
import { UserBook } from '../userBook/userBook.entity';
import { UserRole } from './user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column()
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column()
  surname!: string;

  @Column({ default: 'uk' })
  language!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.User,
  })
  role!: UserRole;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column()
  createdAt!: Date;

  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'followerId', referencedColumnName: 'id' },
  })
  followers!: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following!: User[];

  @OneToMany(() => Review, (review) => review.user)
  reviews!: Review[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments!: Comment[];

  @OneToMany(() => Tracker, (tracker) => tracker.user)
  trackers!: Tracker[];

  @OneToMany(() => UserBook, (userBook) => userBook.user)
  userBooks!: UserBook[];
}
