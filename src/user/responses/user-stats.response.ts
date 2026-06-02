import { ApiProperty } from '@nestjs/swagger';

export class UserStatsResponse {
  @ApiProperty()
  wantToReadCount!: number;

  @ApiProperty()
  currentlyReadingCount!: number;

  @ApiProperty()
  readCount!: number;

  @ApiProperty()
  reviewsCount!: number;

  @ApiProperty()
  followersCount!: number;

  @ApiProperty()
  followingCount!: number;

  constructor(data: UserStatsResponse) {
    Object.assign(this, data);
  }
}
