import { Controller, Patch, Post, Body, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
    constructor(private readonly userService: UserService) { }

    @Patch('me/parcours')
    @ApiOperation({ summary: 'Mettre à jour le parcours de l\'utilisateur' })
    @ApiResponse({ status: 200, description: 'Le parcours a été mis à jour.' })
    async updateParcours(@CurrentUser() user: any, @Body() dto: UpdateParcoursDto) {
        return this.userService.updateParcours(user.id, dto.parcoursId);
    }

    @Patch('me/onboarding/complete')
    @ApiOperation({ summary: 'Marquer l\'onboarding comme complété' })
    @ApiResponse({ status: 200, description: 'L\'onboarding a été marqué comme terminé.' })
    async completeOnboarding(@CurrentUser() user: any) {
        return this.userService.completeOnboarding(user.id);
    }

    @Get('me/scores')
    @ApiOperation({ summary: 'Récupérer l\'historique des scores carbone de l\'utilisateur' })
    @ApiResponse({ status: 200, description: 'Historique des scores récupéré avec succès', type: [ScoreHistoryResponseDto] })
    async getScoreHistory(@CurrentUser() user: any) {
        return this.userService.getScoreHistory(user.id);
    }
}
