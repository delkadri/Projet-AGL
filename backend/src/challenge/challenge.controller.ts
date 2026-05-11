import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ChallengeService } from './challenge.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { ChallengeDto } from './dto/challenge.dto';
import { ChallengeHistoryItemDto } from './dto/challenge-history-item.dto';
import { ChallengeCompletionResponseDto } from './dto/challenge-completion-response.dto';

@ApiTags('Challenges')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get active challenges for the current user' })
  @ApiOkResponse({ type: [ChallengeDto] })
  async getActive(@CurrentUser() user: any) {
    return this.challengeService.getActiveChallenges(user.id);
  }

  @Get('weekly')
  @ApiOperation({ summary: 'Get complete list of challenges for the week' })
  @ApiOkResponse({ type: [ChallengeDto] })
  async getWeekly() {
    return this.challengeService.getWeeklyChallenges();
  }

  @Get('history')
  @ApiOperation({ summary: 'Get history of completed challenges history for user' })
  @ApiOkResponse({ type: [ChallengeHistoryItemDto] })
  async getHistory(@CurrentUser() user: any) {
    return this.challengeService.getHistory(user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a challenge as completed' })
  @ApiParam({ name: 'id', description: 'ID du defi' })
  @ApiResponse({ status: 201, description: 'Challenge completed and reward credited' })
  @ApiCreatedResponse({ type: ChallengeCompletionResponseDto })
  async complete(@Param('id') challengeId: string, @CurrentUser() user: any) {
    return this.challengeService.completeChallenge(user.id, challengeId);
  }
}
