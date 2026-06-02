import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
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
import { UserStatsResponse } from './responses/user-stats.response';

type CreateUserData = {
  email: string;
  password: string;
  name: string;
  surname: string;
  language?:string,
  avatarUrl?: string;
  role?: UserRole;
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
    private readonly mailService: MailService,
  ) {}

  async create(data: CreateUserRequest): Promise<UserResponse> {
    const user = await this.createUser(data);
    return new UserResponse(await this.findUserEntity(user.id));
  }

  async createUser(data: CreateUserData): Promise<User> {
    const exsitingUser=await this.getByEmail(data.email.toLowerCase());

    if(exsitingUser){
      throw new ConflictException(`User with email ${data.email} already exists`);
    }
    
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = this.userRepository.create({
      ...data,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      language: data.language,
      role: data.role ?? UserRole.User,
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
}
