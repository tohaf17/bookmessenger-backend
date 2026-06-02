import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationRequest } from '../common/requests/paginationDto';
import { PaginatedResponse } from '../common/responses/paginationResponse';
import { CreateTrackerItemRequest } from './requests/create-tracker-item.request';
import { UpdateTrackerItemRequest } from './requests/update-tracker-item.request';
import { TrackerItemResponse } from './responses/tracker-item.response';
import { TrackerItem } from './trackerItem.entity';
import { Tracker } from '../tracker/tracker.entity';
import { UserBook } from '../userBook/userBook.entity';

@Injectable()
export class TrackerItemService {
  constructor(
    @InjectRepository(TrackerItem)
    private readonly trackerItemRepository: Repository<TrackerItem>,
    @InjectRepository(Tracker)
    private readonly trackerRepository: Repository<Tracker>,
    @InjectRepository(UserBook)
    private readonly userBookRepository: Repository<UserBook>,
  ) {}

  async create(
    data: CreateTrackerItemRequest,
    userId: number,
  ): Promise<TrackerItemResponse> {
    const trackerItem = this.trackerItemRepository.create(data);
    await this.trackerItemRepository.save(trackerItem);
    return new TrackerItemResponse(
      await this.findTrackerItemEntity(trackerItem.id, userId),
    );
  }

  async findAll(
    params: PaginationRequest,
    userId: number,
  ): Promise<PaginatedResponse<TrackerItemResponse>> {
    const page = params.page ?? 1;
    const quantity = params.quantity ?? 10;
    const skip = (page - 1) * quantity;
    const [trackerItems, trackerItemsCount] =
      await this.trackerItemRepository.findAndCount({
        where: { tracker: { userId } },
        relations: { tracker: true, userBook: { book: true } },
        take: quantity,
        skip,
        order: { id: 'DESC' },
      });

    return {
      data: trackerItems.map(
        (trackerItem) => new TrackerItemResponse(trackerItem),
      ),
      pagination: {
        totalItems: trackerItemsCount,
        currentPage: page,
        itemsPerPage: quantity,
        totalPages: Math.ceil(trackerItemsCount / quantity),
      },
    };
  }

  async findOne(id: number, userId: number): Promise<TrackerItemResponse> {
    return new TrackerItemResponse(await this.findTrackerItemEntity(id, userId));
  }

  async update(
    id: number,
    data: UpdateTrackerItemRequest,
    userId: number,
  ): Promise<TrackerItemResponse> {
    const trackerItem = await this.findTrackerItemEntity(id, userId);
    Object.assign(trackerItem, data);
    await this.trackerItemRepository.save(trackerItem);
    return new TrackerItemResponse(
      await this.findTrackerItemEntity(id, userId),
    );
  }

  async remove(id: number, userId: number): Promise<TrackerItemResponse> {
    const trackerItem = await this.findTrackerItemEntity(id, userId);
    await this.trackerItemRepository.remove(trackerItem);
    return new TrackerItemResponse(trackerItem);
  }

  private async findTrackerItemEntity(
    id: number,
    userId: number,
  ): Promise<TrackerItem> {
    const trackerItem = await this.trackerItemRepository.findOne({
      where: { id },
      relations: { tracker: true },
    });

    if (!trackerItem) {
      throw new NotFoundException(`Tracker item with id ${id} not found`);
    }

    if (trackerItem.tracker.userId !== userId) {
      throw new ForbiddenException('You can modify only your own tracker items');
    }

    return trackerItem;
  }

}
