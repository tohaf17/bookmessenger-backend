import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationRequest } from '../common/requests/paginationDto';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { CreateReviewRequest } from './requests/create-review.request';
import { UpdateReviewRequest } from './requests/update-review.request';
import { ReviewResponse } from './responses/review.response';
import { Review } from './review.entity';
import { UserRole } from '../user/user-role.enum';
import { BookService } from '../book/book.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly bookService: BookService,
  ) {}

  async create(
    data: CreateReviewRequest,
    userId: number,
  ): Promise<ReviewResponse> {
    const review = this.reviewRepository.create({
      ...data,
      userId,
      createdAt: new Date(),
    });

    await this.reviewRepository.save(review);
    await this.bookService.invalidateBookCache(data.bookId);
    return new ReviewResponse(await this.findReviewEntity(review.id));
  }

  async findAll(
    params: PaginationRequest,
    bookId?: number,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.book', 'book')
      .take(quantity)
      .skip(skip)
      .orderBy('review.id', 'DESC');

    if (bookId) {
      queryBuilder.where('review.bookId = :bookId', { bookId });
    }

    const [reviews, reviewsCount] = await queryBuilder.getManyAndCount();

    return {
      data: reviews.map((review) => new ReviewResponse(review)),
      pagination: {
        totalItems: reviewsCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(reviewsCount / quantity),
      },
    };
  }

  async findOne(id: number): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    return new ReviewResponse(review);
  }

  async like(id: number): Promise<ReviewResponse> {
    return this.updateLikes(id, 'likesCount');
  }

  async dislike(id: number): Promise<ReviewResponse> {
    return this.updateLikes(id, 'dislikesCount');
  }

  async update(
    id: number,
    data: UpdateReviewRequest,
    userId: number,
  ): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    this.assertOwner(review, userId);
    Object.assign(review, data);
    await this.reviewRepository.save(review);
    await this.bookService.invalidateBookCache(review.bookId);
    return new ReviewResponse(await this.findReviewEntity(id));
  }

  async remove(id: number, userId: number, userRole: UserRole): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    this.assertOwnerOrAdmin(review, userId, userRole);
    await this.reviewRepository.remove(review);
    await this.bookService.invalidateBookCache(review.bookId);
    return new ReviewResponse(review);
  }

  private async updateLikes(
    id: number,
    field: 'likesCount' | 'dislikesCount',
  ): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    review[field] = (review[field] ?? 0) + 1;
    await this.reviewRepository.save(review);
    await this.bookService.invalidateBookCache(review.bookId);
    return new ReviewResponse(await this.findReviewEntity(id));
  }

  private async findReviewEntity(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: { user: true, book: true },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    return review;
  }

  private assertOwner(review: Review, userId: number): void {
    if (review.userId === userId) {
      return;
    }

    throw new ForbiddenException('You can modify only your own reviews');
  }

  private assertOwnerOrAdmin(review: Review, userId: number, userRole: UserRole): void {
    if (review.userId === userId || userRole === UserRole.Admin) {
      return;
    }

    throw new ForbiddenException('You can modify only your own reviews');
  }
}
