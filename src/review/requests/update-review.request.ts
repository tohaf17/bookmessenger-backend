import { PartialType } from '@nestjs/swagger';
import { CreateReviewRequest } from './create-review.request';

export class UpdateReviewRequest extends PartialType(CreateReviewRequest) {}
