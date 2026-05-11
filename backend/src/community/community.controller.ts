import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { InterCommunityLeaderboardEntryDto } from './dto/inter-community-leaderboard.dto';
import { GroupService } from './group.service';

@ApiTags('communities')
@Controller('communities')
export class CommunityController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly groupService: GroupService,
  ) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Classement inter-communautés' })
  @ApiResponse({ status: 200, type: [InterCommunityLeaderboardEntryDto] })
  getLeaderboard(): Promise<InterCommunityLeaderboardEntryDto[]> {
    return this.groupService.getLeaderboard();
  }

  @Get('ranking/next-reset')
  @ApiOperation({
    summary: 'Timestamp de la prochaine remise à zéro des classements',
  })
  @ApiResponse({
    status: 200,
    schema: { example: { nextReset: '2026-07-01T00:00:00.000Z' } },
  })
  getNextRankingReset(): { nextReset: string } {
    return {
      nextReset: this.challengeService.getNextRankingReset().toISOString(),
    };
  }
}
