import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationRequest } from '../../common/requests/paginationDto';
import { UserBookStatus } from './create-user-book.request';

export class UserBookQueryRequest extends PaginationRequest {
  @ApiPropertyOptional({ enum: UserBookStatus })
  @IsOptional()
  @IsEnum(UserBookStatus)
  status?: UserBookStatus;
}
