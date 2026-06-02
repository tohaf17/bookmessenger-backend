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
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../user/user-role.enum';
import type { AuthRequest } from '../auth/auth-request.type';
import { BookService } from './book.service';
import { CreateBookRequest } from './requests/create-book.request';
import { UpdateBookRequest } from './requests/update-book.request';
import { BookResponse } from './responses/book.response';
import { BookQueryRequest } from './requests/book-query.request';
import { BookDetailsResponse } from './responses/book-details.response';
import { GoogleBookResponse } from './responses/google-book.response';

@ApiTags('Books')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  @ApiOperation({ summary: 'Create book' })
  @ApiCreatedResponse({ type: BookResponse })
  create(@Body() data: CreateBookRequest) {
    return this.bookService.create(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get books with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'genre', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiPaginatedResponse(BookResponse)
  findAll(@Query() params: BookQueryRequest) {
    return this.bookService.findAll(params);
  }

  @Get('search/google')
  @ApiOperation({ summary: 'Search books via Open Library' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search query' })
  @ApiOkResponse({ type: [GoogleBookResponse] })
  searchGoogle(@Query('q') query: string) {
    return this.bookService.searchGoogleBooks(query);
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get book details' })
  @ApiOkResponse({ type: BookDetailsResponse })
  @ApiNotFoundResponse({ description: 'Book not found' })
  findDetails(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: AuthRequest,
  ) {
    return this.bookService.findDetails(id, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get book by id' })
  @ApiOkResponse({ type: BookResponse })
  @ApiNotFoundResponse({ description: 'Book not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Update book by id' })
  @ApiOkResponse({ type: BookResponse })
  @ApiNotFoundResponse({ description: 'Book not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBookRequest,
  ) {
    return this.bookService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Delete book by id' })
  @ApiOkResponse({ type: BookResponse })
  @ApiNotFoundResponse({ description: 'Book not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookService.remove(id);
  }
}
