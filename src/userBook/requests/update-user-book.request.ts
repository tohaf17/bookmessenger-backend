import { PartialType } from '@nestjs/swagger';
import { CreateUserBookRequest } from './create-user-book.request';

export class UpdateUserBookRequest extends PartialType(CreateUserBookRequest) {}
