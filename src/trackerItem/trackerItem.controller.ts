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
import { CreateTrackerItemRequest } from './requests/create-tracker-item.request';
import { UpdateTrackerItemRequest } from './requests/update-tracker-item.request';
import { TrackerItemResponse } from './responses/tracker-item.response';
import { TrackerItemService } from './trackerItem.service';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('Tracker Items')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tracker-items')
export class TrackerItemController {
  constructor(private readonly trackerItemService: TrackerItemService) {}

  @Post()
  @ApiOperation({ summary: 'Create tracker item' })
  @ApiCreatedResponse({ type: TrackerItemResponse })
  create(@Body() data: CreateTrackerItemRequest, @Request() req: AuthRequest) {
    return this.trackerItemService.create(data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get tracker items with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(TrackerItemResponse)
  findAll(@Query() params: PaginationRequest, @Request() req: AuthRequest) {
    return this.trackerItemService.findAll(params, req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get tracker items of a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(TrackerItemResponse)
  findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() params: PaginationRequest,
  ) {
    return this.trackerItemService.findAll(params, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tracker item by id' })
  @ApiOkResponse({ type: TrackerItemResponse })
  @ApiNotFoundResponse({ description: 'Tracker item not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.trackerItemService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tracker item by id' })
  @ApiOkResponse({ type: TrackerItemResponse })
  @ApiNotFoundResponse({ description: 'Tracker item not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTrackerItemRequest,
    @Request() req: AuthRequest,
  ) {
    return this.trackerItemService.update(id, data, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tracker item by id' })
  @ApiOkResponse({ type: TrackerItemResponse })
  @ApiNotFoundResponse({ description: 'Tracker item not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.trackerItemService.remove(id, req.user.id);
  }
}
