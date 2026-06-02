import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tracker } from './tracker.entity';
import { TrackerController } from './tracker.controller';
import { TrackerService } from './tracker.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tracker])],
  controllers: [TrackerController],
  providers: [TrackerService],
  exports: [TrackerService],
})
export class TrackerModule {}
