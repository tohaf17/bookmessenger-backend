import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { UserRole } from '../user/user-role.enum';
import { PaginationRequest } from '../common/requests/paginationDto';
import { CommentService } from './comment.service';
import { CreateCommentRequest } from './requests/create-comment.request';
import { UpdateCommentRequest } from './requests/update-comment.request';
import { CommentResponse } from './responses/comment.response';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  @ApiCreatedResponse({ type: CommentResponse })
  create(@Body() data: CreateCommentRequest, @Request() req: AuthRequest) {
    return this.commentService.create(data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get comments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'bookId', required: true, type: Number })
  @ApiPaginatedResponse(CommentResponse)
  findAll(
    @Query() params: PaginationRequest,
    @Query('bookId', ParseIntPipe) bookId: number,
  ) {
    
    return this.commentService.findAll(params, bookId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comment by id' })
  @ApiOkResponse({ type: CommentResponse })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment by id' })
  @ApiOkResponse({ type: CommentResponse })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCommentRequest,
    @Request() req: AuthRequest,
  ) {
    return this.commentService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comment by id' })
  @ApiOkResponse({ type: CommentResponse })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.commentService.remove(id, req.user.id, req.user.role);
  }

  @Post('reply')
  @HttpCode(201)
  @ApiOperation({ summary: 'Reply to a comment' })
  @ApiCreatedResponse({ type: CommentResponse })
  reply(
    @Body('content') content: string,
    @Body('parentId', ParseIntPipe) parentId: number,
    @Body('bookId', ParseIntPipe) bookId: number,
    @Request() req: AuthRequest,
  ) {
    return this.commentService.reply(content, req.user.id, parentId, bookId);
  }
}
