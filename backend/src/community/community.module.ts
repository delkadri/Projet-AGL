import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChallengeScheduler } from './challenge.scheduler';
import { ChallengeService } from './challenge.service';
import { GroupService } from './group.service';

@Module({
  imports: [ScheduleModule],
  providers: [GroupService, ChallengeService, ChallengeScheduler],
  exports: [GroupService, ChallengeService],
})
export class CommunityModule {}
