import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, Repository } from 'typeorm';
import { PaginationRequest } from '../common/requests/paginationDto';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { CreateUserRequest } from './requests/create-user.request';
import { UpdateUserRequest } from './requests/update-user.request';
import { UserResponse } from './responses/user.response';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { MailService } from '../mail/mail.service';
import { UserBook } from '../userBook/userBook.entity';
import { Review } from '../review/review.entity';
import { Comment } from '../comment/comment.entity';
import { Tracker } from '../tracker/tracker.entity';
import { TrackerItem } from '../trackerItem/trackerItem.entity';
import { UserStatsResponse } from './responses/user-stats.response';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
} from './user.constants';

type CreateUserData = {
  email: string;
  password: string;
  name: string;
  surname: string;
  language?:string,
  avatarUrl?: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    @InjectRepository(TrackerItem)
    private readonly trackerItemRepository: Repository<TrackerItem>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultAdmin();
  }

  async create(data: CreateUserRequest): Promise<UserResponse> {
    const user = await this.createUser(data);
    return new UserResponse(await this.findUserEntity(user.id));
  }

  async createUser(data: CreateUserData): Promise<User> {
    const normalizedEmail = data.email.toLowerCase();
    const exsitingUser = await this.getByEmail(normalizedEmail);

    if (exsitingUser) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const isDefaultAdmin = normalizedEmail === DEFAULT_ADMIN_EMAIL;
    const user = this.userRepository.create({
      ...data,
      email: normalizedEmail,
      password: hashedPassword,
      language: data.language,
      role: isDefaultAdmin ? UserRole.Admin : UserRole.User,
      createdAt: new Date(),
    });

    return this.userRepository.save(user);
  }

  getByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async getUserById(id: number): Promise<User> {
    return this.findUserEntity(id);
  }

  async findAll(
    params: PaginationRequest,
  ): Promise<PaginatedResponse<UserResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const [users, usersCount] = await this.userRepository.findAndCount({
      take: quantity,
      skip,
      order: { id: 'DESC' },
    });

    return {
      data: users.map((user) => new UserResponse(user)),
      pagination: {
        totalItems: usersCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(usersCount / quantity),
      },
    };
  }

  async addNewFollower(userId: number, followerId: number): Promise<void> {
    if (userId === followerId) {
      throw new NotFoundException(`User cannot follow themselves`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { followers: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const follower = await this.userRepository.findOne({ where: { id: followerId } });

    if (!follower) {
      throw new NotFoundException(`Follower with id ${followerId} not found`);
    }

    if (user.followers.some((f) => f.id === followerId)) {
      return;
    }

    user.followers.push(follower);
    await this.userRepository.save(user);
    await this.mailService.sendNewFollowerNotification({
      to: user.email,
      lang: user.language,
      data: {
        followerName: follower.name
      },
    });
    
  }

  async getFollowers(userId: number): Promise<UserResponse[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { followers: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user.followers.map((follower) => new UserResponse(follower));
  }

  async getFollowing(userId: number): Promise<UserResponse[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { following: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    return user.following.map((followed) => new UserResponse(followed));
  }
  
  async removeFollower(userId: number, followerId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { followers: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const follower = await this.userRepository.findOne({ where: { id: followerId } });

    if (!follower) {
      throw new NotFoundException(`Follower with id ${followerId} not found`);
    }

    user.followers = user.followers.filter((f) => f.id !== followerId);
    await this.userRepository.save(user);
  }

  async findOne(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return new UserResponse(user);
  }

  async getStats(id: number): Promise<UserStatsResponse> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { followers: true, following: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const [
      wantToReadCount,
      currentlyReadingCount,
      readCount,
      reviewsCount,
    ] = await Promise.all([
      this.userBookRepository.count({
        where: { userId: id, status: 'wantToRead' },
      }),
      this.userBookRepository.count({
        where: { userId: id, status: 'currentlyReading' },
      }),
      this.userBookRepository.count({
        where: { userId: id, status: 'read' },
      }),
      this.reviewRepository.count({ where: { userId: id } }),
    ]);

    return new UserStatsResponse({
      wantToReadCount,
      currentlyReadingCount,
      readCount,
      reviewsCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  }

  async update(
    id: number,
    data: UpdateUserRequest,
    currentUserId: number,
    currentUserRole: UserRole,
  ): Promise<UserResponse> {
    this.assertSelfOrAdmin(id, currentUserId, currentUserRole);
    const user = await this.findUserEntity(id);
    this.assertNotDefaultAdmin(user);
    Object.assign(user, {
      ...data,
      email: data.email ? data.email.toLowerCase() : user.email,
      password: data.password
        ? await bcrypt.hash(data.password, 10)
        : user.password,
    });
    await this.userRepository.save(user);
    return new UserResponse(await this.findUserEntity(id));
  }

  async remove(
    id: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ): Promise<UserResponse> {
    this.assertSelfOrAdmin(id, currentUserId, currentUserRole);
    const user = await this.findUserEntity(id);
    this.assertNotDefaultAdmin(user);
    await this.removeUserDependencies(id);
    await this.userRepository.remove(user);
    return new UserResponse(user);
  }

  private async findUserEntity(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private assertSelfOrAdmin(
    targetUserId: number,
    currentUserId: number,
    currentUserRole: UserRole,
  ): void {
    if (targetUserId === currentUserId || currentUserRole === UserRole.Admin) {
      return;
    }

    throw new ForbiddenException('You can modify only your own user');
  }

  private async ensureDefaultAdmin(): Promise<void> {
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const existingAdmin = await userRepo.findOne({
        where: { email: DEFAULT_ADMIN_EMAIL },
      });

      if (existingAdmin) {
        existingAdmin.password = hashedPassword;
        existingAdmin.role = UserRole.Admin;
        existingAdmin.name = existingAdmin.name || 'Admin';
        existingAdmin.surname = existingAdmin.surname || 'BookMessenger';
        existingAdmin.language = existingAdmin.language || 'uk';
        await userRepo.save(existingAdmin);
      } else {
        await userRepo.save(
          userRepo.create({
            email: DEFAULT_ADMIN_EMAIL,
            password: hashedPassword,
            name: 'Admin',
            surname: 'BookMessenger',
            language: 'uk',
            role: UserRole.Admin,
            createdAt: new Date(),
          }),
        );
      }

      const otherAdmins = await userRepo.find({
        where: { role: UserRole.Admin },
      });

      const staleAdmins = otherAdmins.filter((user) => user.email !== DEFAULT_ADMIN_EMAIL);
      for (const staleAdmin of staleAdmins) {
        staleAdmin.role = UserRole.User;
        await userRepo.save(staleAdmin);
      }
    });
  }

  private async removeUserDependencies(userId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'DELETE FROM "user_followers" WHERE "userId" = $1 OR "followerId" = $1',
        [userId],
      );

      const commentRepo = manager.getRepository(Comment);
      const reviewRepo = manager.getRepository(Review);
      const userBookRepo = manager.getRepository(UserBook);
      const trackerRepo = manager.getRepository(Tracker);
      const trackerItemRepo = manager.getRepository(TrackerItem);

      const trackers = await trackerRepo.find({ where: { userId } });
      if (trackers.length > 0) {
        const trackerIds = trackers.map((tracker) => tracker.id);
        await trackerItemRepo
          .createQueryBuilder()
          .delete()
          .where('trackerId IN (:...trackerIds)', { trackerIds })
          .execute();
      }

      await commentRepo.delete({ userId });
      await reviewRepo.delete({ userId });
      await userBookRepo.delete({ userId });
      await trackerRepo.delete({ userId });
    });
  }

  private assertNotDefaultAdmin(user: User): void {
    if (user.email === DEFAULT_ADMIN_EMAIL) {
      throw new ForbiddenException('Default admin account cannot be modified');
    }
  }
}
