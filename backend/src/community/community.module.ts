import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from '../supabase/supabase.module';
import { ChallengeScheduler } from './challenge.scheduler';
import { ChallengeService } from './challenge.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { CommunityController } from './community.controller';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';

@Module({
  imports: [ScheduleModule, SupabaseModule],
  controllers: [CommunityController, GroupController, ChatController],
  providers: [GroupService, ChallengeService, ChallengeScheduler, ChatService],
  exports: [GroupService, ChallengeService, ChatService],
})
export class CommunityModule {}
