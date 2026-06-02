import { PartialType } from '@nestjs/swagger';
import { CreateTrackerRequest } from './create-tracker.request';

export class UpdateTrackerRequest extends PartialType(CreateTrackerRequest) {}
