import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationRequest } from '../../common/requests/paginationDto';

export class BookQueryRequest extends PaginationRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  author?: string;
}
