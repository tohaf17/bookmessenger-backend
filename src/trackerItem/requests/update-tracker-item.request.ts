import { PartialType } from '@nestjs/swagger';
import { CreateTrackerItemRequest } from './create-tracker-item.request';

export class UpdateTrackerItemRequest extends PartialType(
  CreateTrackerItemRequest,
) {}
