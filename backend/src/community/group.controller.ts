import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { ChallengeService } from './challenge.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';

@ApiTags('groups')
@Controller('groups')
@UseGuards(SupabaseAuthGuard)
@ApiBearerAuth()
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly challengeService: ChallengeService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: "Liste des groupes de l'utilisateur connecté" })
  @ApiResponse({ status: 200, description: 'Groupes retournés' })
  getMyGroups(@CurrentUser() user: any) {
    return this.groupService.getMyGroups(user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Rechercher un groupe public par nom' })
  @ApiQuery({ name: 'name', required: true, example: 'Warriors' })
  @ApiResponse({ status: 200, description: 'Groupes correspondants' })
  searchGroups(@Query('name') name: string) {
    return this.groupService.searchGroups(name ?? '');
  }

  @Post('join/:code')
  @ApiOperation({ summary: 'Rejoindre un groupe privé via code d\'invitation' })
  @ApiResponse({ status: 201, description: 'Groupe rejoint' })
  @ApiResponse({ status: 404, description: 'Code invalide' })
  @ApiResponse({ status: 409, description: 'Déjà membre' })
  joinGroupByCode(@CurrentUser() user: any, @Param('code') code: string) {
    return this.groupService.joinGroupByCode(user.id, code);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un groupe (niveau ≥ 3 requis)' })
  @ApiResponse({ status: 201, description: 'Groupe créé' })
  @ApiResponse({ status: 403, description: 'Niveau insuffisant' })
  createGroup(@CurrentUser() user: any, @Body() dto: CreateGroupDto) {
    return this.groupService.createGroup(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails du groupe (membres, win streak, défi en cours)' })
  @ApiResponse({ status: 200, description: 'Détails du groupe' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  getGroupDetails(@Param('id') id: string) {
    return this.groupService.getGroupDetails(id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Rejoindre un groupe public' })
  @ApiResponse({ status: 201, description: 'Groupe rejoint' })
  @ApiResponse({ status: 403, description: 'Groupe privé' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  @ApiResponse({ status: 409, description: 'Déjà membre' })
  joinGroupById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.groupService.joinGroupById(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Dissoudre le groupe (admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Groupe supprimé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  deleteGroup(@CurrentUser() user: any, @Param('id') id: string) {
    return this.groupService.deleteGroup(user.id, id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Exclure un membre (admin uniquement)' })
  @ApiResponse({ status: 200, description: 'Membre exclu' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  @ApiResponse({ status: 404, description: 'Groupe non trouvé' })
  removeMember(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.groupService.removeMember(user.id, id, userId);
  }

  @Get(':id/challenge')
  @ApiOperation({ summary: 'Défi de la semaine + barre de progression' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        groupChallengeId: 'uuid',
        challenge: { id: 'uuid', title: '...', description: '...' },
        weekStartAt: '2026-05-11T00:00:00.000Z',
        weekEndAt: '2026-05-17T23:59:59.999Z',
        completedCount: 3,
        totalMembers: 5,
        progressRatio: 0.6,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Aucun défi cette semaine' })
  getGroupChallenge(@Param('id') id: string) {
    return this.challengeService.getGroupCurrentChallenge(id);
  }

  @Post(':id/challenge/complete')
  @ApiOperation({ summary: 'Marquer le défi hebdomadaire comme complété' })
  @ApiResponse({ status: 201, description: 'Défi complété' })
  @ApiResponse({ status: 404, description: 'Aucun défi cette semaine' })
  @ApiResponse({ status: 409, description: 'Défi déjà complété' })
  completeChallenge(@CurrentUser() user: any, @Param('id') id: string) {
    return this.challengeService.completeCurrentWeekChallenge(user.id, id);
  }
}
