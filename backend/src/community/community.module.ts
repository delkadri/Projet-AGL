import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ChallengeScheduler } from './challenge.scheduler';
import { ChallengeService } from './challenge.service';
import { CommunityController } from './community.controller';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [ScheduleModule],
  controllers: [CommunityController, GroupController],
  providers: [GroupService, ChallengeService, ChallengeScheduler],
  exports: [GroupService, ChallengeService],
})
export class CommunityModule {}
