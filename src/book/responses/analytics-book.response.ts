import { ApiProperty } from '@nestjs/swagger';


export class AnalyticsBookResponse {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  readRightNowCount!: number;
  @ApiProperty()
  wantToReadCount!: number;
  @ApiProperty()
  alreadyReadCount!: number;

  constructor(data: {
    id: number;
    readRightNowCount: number;
    wantToReadCount: number;
    alreadyReadCount: number;
    }) {
        this.alreadyReadCount = data.alreadyReadCount;
        this.id = data.id;
        this.readRightNowCount = data.readRightNowCount;
        this.wantToReadCount = data.wantToReadCount;
    }
}