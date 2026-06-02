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

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
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
    return new ReviewResponse(await this.findReviewEntity(review.id));
  }

  async findAll(
    params: PaginationRequest,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const [reviews, reviewsCount] = await this.reviewRepository.findAndCount({
      relations: { user: true },
      take: quantity,
      skip,
      order: { id: 'DESC' },
    });

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

  async update(
    id: number,
    data: UpdateReviewRequest,
    userId: number,
  ): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    this.assertOwner(review, userId);
    Object.assign(review, data);
    await this.reviewRepository.save(review);
    return new ReviewResponse(await this.findReviewEntity(id));
  }

  async remove(id: number, userId: number): Promise<ReviewResponse> {
    const review = await this.findReviewEntity(id);
    this.assertOwner(review, userId);
    await this.reviewRepository.remove(review);
    return new ReviewResponse(review);
  }

  private async findReviewEntity(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: { user: true },
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
}
