import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { UpdateParcoursDto } from './dto/update-parcours.dto';
import { ScoreHistoryResponseDto } from './dto/score-history.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me/parcours')
  @ApiOperation({ summary: "Mettre à jour le parcours de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Le parcours a été mis à jour.' })
  async updateParcours(
    @CurrentUser() user: any,
    @Body() dto: UpdateParcoursDto,
  ) {
    return this.userService.updateParcours(user.id, dto.parcoursId);
  }

  @Patch('me/onboarding/complete')
  @ApiOperation({ summary: "Marquer l'onboarding comme complété" })
  @ApiResponse({
    status: 200,
    description: "L'onboarding a été marqué comme terminé.",
  })
  async completeOnboarding(@CurrentUser() user: any) {
    return this.userService.completeOnboarding(user.id);
  }

  @Post('me/onboarding/reset-retest')
  @ApiBody({
    required: false,
    description: 'Corps optionnel (ex. `{}`) pour compatibilité clients JSON.',
    schema: { type: 'object', additionalProperties: true, example: {} },
  })
  @ApiOperation({
    summary:
      '[TEMP] Réinitialiser onboarding et effacer les scores enregistrés (refaire le quiz)',
    description:
      "Remet onboarding_completed à false et supprime toutes les entrées score_history de l'utilisateur (y compris quiz mensuel) pour que le prochain onboarding redevienne le « premier » bilan.",
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding réinitialisé, historique des scores effacé.',
  })
  async resetOnboardingForRetest(@CurrentUser() user: any) {
    if (!user?.id) {
      throw new UnauthorizedException('Token invalide : identifiant manquant.');
    }
    return this.userService.resetOnboardingForRetest(user.id);
  }

  @Get('me/scores')
  @ApiOperation({
    summary: "Récupérer l'historique des scores carbone de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Historique des scores récupéré avec succès',
    type: [ScoreHistoryResponseDto],
  })
  async getScoreHistory(@CurrentUser() user: any) {
    return this.userService.getScoreHistory(user.id);
  }
}
