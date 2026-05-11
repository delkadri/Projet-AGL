import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ChallengeService } from './challenge.service';

@Injectable()
export class ChallengeScheduler {
  constructor(private readonly challengeService: ChallengeService) {}

  @Cron('0 0 * * 1', { timeZone: 'UTC' })
  async assignWeeklyChallenges() {
    await this.challengeService.assignWeeklyChallengesToAllGroups();
  }

  @Cron('59 23 * * 0', { timeZone: 'UTC' })
  async resetStreaks() {
    await this.challengeService.processWeeklyStreakResets();
  }

  // 1er janvier, avril, juillet, octobre à 00:00 UTC
  @Cron('0 0 1 1,4,7,10 *', { timeZone: 'UTC' })
  async resetGroupRankings() {
    await this.challengeService.resetGroupRankings();
  }
}
