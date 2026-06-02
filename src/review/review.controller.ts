import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import { PaginationRequest } from '../common/requests/paginationDto';
import { CreateReviewRequest } from './requests/create-review.request';
import { UpdateReviewRequest } from './requests/update-review.request';
import { ReviewResponse } from './responses/review.response';
import { ReviewService } from './review.service';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Create review' })
  @ApiCreatedResponse({ type: ReviewResponse })
  create(@Body() data: CreateReviewRequest, @Request() req: AuthRequest) {
    return this.reviewService.create(data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(ReviewResponse)
  findAll(@Query() params: PaginationRequest) {
    return this.reviewService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by id' })
  @ApiOkResponse({ type: ReviewResponse })
  @ApiNotFoundResponse({ description: 'Review not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review by id' })
  @ApiOkResponse({ type: ReviewResponse })
  @ApiNotFoundResponse({ description: 'Review not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateReviewRequest,
    @Request() req: AuthRequest,
  ) {
    return this.reviewService.update(id, data, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete review by id' })
  @ApiOkResponse({ type: ReviewResponse })
  @ApiNotFoundResponse({ description: 'Review not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.reviewService.remove(id, req.user.id);
  }
}
