import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../common/decorators/api-paginated-response.decorator';
import type { AuthRequest } from '../auth/auth-request.type';
import { UserBookQueryRequest } from '../userBook/requests/user-book-query.request';
import { UserBookResponse } from '../userBook/responses/user-book.response';
import { UserBookService } from '../userBook/userBook.service';

@ApiTags('Me')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('me')
export class MeController {
  constructor(private readonly userBookService: UserBookService) {}

  @Get('books')
  @ApiOperation({ summary: 'Get current user books' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['wantToRead', 'currentlyReading', 'read'],
  })
  @ApiPaginatedResponse(UserBookResponse)
  findMyBooks(
    @Query() params: UserBookQueryRequest,
    @Request() req: AuthRequest,
  ) {
    return this.userBookService.findAll(params, req.user.id);
  }
}
