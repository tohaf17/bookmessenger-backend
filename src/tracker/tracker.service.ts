import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationRequest } from '../common/requests/paginationDto';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { CreateTrackerRequest } from './requests/create-tracker.request';
import { UpdateTrackerRequest } from './requests/update-tracker.request';
import { TrackerResponse } from './responses/tracker.response';
import { Tracker } from './tracker.entity';

@Injectable()
export class TrackerService {
  constructor(
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
  ) {}

  async create(
    data: CreateTrackerRequest,
    userId: number,
  ): Promise<TrackerResponse> {
    const existingTracker = await this.trackerRepository.findOne({
      where: { userId },
    });

    if (existingTracker) {
      throw new ConflictException('User already has a tracker');
    }

    const tracker = this.trackerRepository.create({
      ...data,
      userId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
    await this.trackerRepository.save(tracker);
    return new TrackerResponse(await this.findTrackerEntity(tracker.id, userId));
  }

  async findAll(
    params: PaginationRequest,
    userId: number,
  ): Promise<PaginatedResponse<TrackerResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const [trackers, trackersCount] = await this.trackerRepository.findAndCount(
      {
        where: { userId },
        take: quantity,
        skip,
        order: { id: 'DESC' },
      },
    );

    return {
      data: trackers.map((tracker) => new TrackerResponse(tracker)),
      pagination: {
        totalItems: trackersCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(trackersCount / quantity),
      },
    };
  }

  async findOne(id: number, userId: number): Promise<TrackerResponse> {
    const tracker = await this.findTrackerEntity(id, userId);
    return new TrackerResponse(tracker);
  }
  

  async update(
    id: number,
    data: UpdateTrackerRequest,
    userId: number,
  ): Promise<TrackerResponse> {
    const tracker = await this.findTrackerEntity(id, userId);
    Object.assign(tracker, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : tracker.startDate,
      endDate: data.endDate ? new Date(data.endDate) : tracker.endDate,
    });
    await this.trackerRepository.save(tracker);
    return new TrackerResponse(await this.findTrackerEntity(id, userId));
  }

  async remove(id: number, userId: number): Promise<TrackerResponse> {
    const tracker = await this.findTrackerEntity(id, userId);
    await this.trackerRepository.remove(tracker);
    return new TrackerResponse(tracker);
  }

  private async findTrackerEntity(id: number, userId: number): Promise<Tracker> {
    const tracker = await this.trackerRepository.findOne({
      where: { id, userId },
    });

    if (!tracker) {
      throw new NotFoundException(`Tracker with id ${id} not found`);
    }

    return tracker;
  }
}
