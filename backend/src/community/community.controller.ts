import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';

@ApiTags('communities')
@Controller('communities')
export class CommunityController {
  constructor(private readonly challengeService: ChallengeService) {}

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
