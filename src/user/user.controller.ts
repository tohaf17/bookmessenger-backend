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
import { PaginationRequest } from '../common/requests/paginationDto';
import { CreateUserRequest } from './requests/create-user.request';
import { UpdateUserRequest } from './requests/update-user.request';
import { UserResponse } from './responses/user.response';
import { UserService } from './user.service';
import type { AuthRequest } from '../auth/auth-request.type';
import { UserRole } from './user-role.enum';
import { UserStatsResponse } from './responses/user-stats.response';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ type: UserResponse })
  create(@Body() data: CreateUserRequest) {
    return this.userService.create(data);
  }

  @Post(':id/follow')
  @ApiOperation({ summary: 'Add new follower to user' })
  @ApiOkResponse({ description: 'Follower added successfully' })
  @ApiNotFoundResponse({ description: 'User or follower not found' })
  addNewFollower(
    @Param('id', ParseIntPipe) userId: number,
    @Request() req: AuthRequest,
  ) {
    return this.userService.addNewFollower(userId, req.user.id);
  }

  @Delete(':id/unfollow')
  @ApiOperation({ summary: 'Remove follower from user' })
  @ApiOkResponse({ description: 'Follower removed successfully' })
  @ApiNotFoundResponse({ description: 'User or follower not found' })
  removeFollower(
    @Param('id', ParseIntPipe) userId: number,
    @Request() req: AuthRequest,
  ) {
    return this.userService.removeFollower(userId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(UserResponse)
  findAll(@Query() params: PaginationRequest) {
    return this.userService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get user stats' })
  @ApiOkResponse({ type: UserStatsResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserRequest,
    @Request() req: AuthRequest,
  ) {
    return this.userService.update(id, data, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiOkResponse({ type: UserResponse })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.userService.remove(id, req.user.id, req.user.role);
  }

  @Get(':id/followers')
  @ApiOperation({ summary: 'Get followers of user' })
  @ApiOkResponse({ type: [UserResponse] })
  @ApiNotFoundResponse({ description: 'User not found' })
  getFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getFollowers(id);
  }

  @Get(':id/following')
  @ApiOperation({ summary: 'Get users followed by user' })
  @ApiOkResponse({ type: [UserResponse] })
  @ApiNotFoundResponse({ description: 'User not found' })
  getFollowing(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getFollowing(id);
  }
}
