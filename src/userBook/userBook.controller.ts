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
import { CreateUserBookRequest } from './requests/create-user-book.request';
import { UpdateUserBookRequest } from './requests/update-user-book.request';
import { UserBookQueryRequest } from './requests/user-book-query.request';
import { UserBookResponse } from './responses/user-book.response';
import { UserBookService } from './userBook.service';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('User Books')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user-books')
export class UserBookController {
  constructor(private readonly userBookService: UserBookService) {}

  @Post()
  @ApiOperation({ summary: 'Create user book' })
  @ApiCreatedResponse({ type: UserBookResponse })
  create(@Body() data: CreateUserBookRequest, @Request() req: AuthRequest) {
    return this.userBookService.create(data, req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user books by userId with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['wantToRead', 'currentlyReading', 'read'],
  })
  @ApiPaginatedResponse(UserBookResponse)
  findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() params: UserBookQueryRequest,
  ) {
    return this.userBookService.findAll(params, userId);
  }

  @Get('by-book/:bookId')
  @ApiOperation({ summary: 'Get current user book by book id' })
  @ApiOkResponse({ type: UserBookResponse })
  findByBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Request() req: AuthRequest,
  ) {
    return this.userBookService.findByBook(bookId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user book by id' })
  @ApiOkResponse({ type: UserBookResponse })
  @ApiNotFoundResponse({ description: 'User book not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.userBookService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user book by id' })
  @ApiOkResponse({ type: UserBookResponse })
  @ApiNotFoundResponse({ description: 'User book not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserBookRequest,
    @Request() req: AuthRequest,
  ) {
    return this.userBookService.update(id, data, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user book by id' })
  @ApiOkResponse({ type: UserBookResponse })
  @ApiNotFoundResponse({ description: 'User book not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.userBookService.remove(id, req.user.id);
  }
}
