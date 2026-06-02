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
import { CreateTrackerRequest } from './requests/create-tracker.request';
import { UpdateTrackerRequest } from './requests/update-tracker.request';
import { TrackerResponse } from './responses/tracker.response';
import { TrackerService } from './tracker.service';
import type { AuthRequest } from '../auth/auth-request.type';

@ApiTags('Trackers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('trackers')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Post()
  @ApiOperation({ summary: 'Create tracker' })
  @ApiCreatedResponse({ type: TrackerResponse })
  create(@Body() data: CreateTrackerRequest, @Request() req: AuthRequest) {
    return this.trackerService.create(data, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get trackers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(TrackerResponse)
  findAll(@Query() params: PaginationRequest, @Request() req: AuthRequest) {
    return this.trackerService.findAll(params, req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get active trackers/challenges of a specific user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'quantity', required: false, type: Number, example: 10 })
  @ApiPaginatedResponse(TrackerResponse)
  findAllByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() params: PaginationRequest,
  ) {
    return this.trackerService.findAll(params, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tracker by id' })
  @ApiOkResponse({ type: TrackerResponse })
  @ApiNotFoundResponse({ description: 'Tracker not found' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.trackerService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tracker by id' })
  @ApiOkResponse({ type: TrackerResponse })
  @ApiNotFoundResponse({ description: 'Tracker not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateTrackerRequest,
    @Request() req: AuthRequest,
  ) {
    return this.trackerService.update(id, data, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tracker by id' })
  @ApiOkResponse({ type: TrackerResponse })
  @ApiNotFoundResponse({ description: 'Tracker not found' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: AuthRequest) {
    return this.trackerService.remove(id, req.user.id);
  }
}
