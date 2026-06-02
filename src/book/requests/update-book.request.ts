import { PartialType } from '@nestjs/swagger';
import { CreateBookRequest } from './create-book.request';

export class UpdateBookRequest extends PartialType(CreateBookRequest) {}
