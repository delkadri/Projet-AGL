import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  ApiConflictResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CalculateQuizScoreDto } from './dto/calculate-quiz-score.dto';
import { PreviewQuizScoreDto } from './dto/preview-quiz-score.dto';
import { QuizScoringService } from './quiz-scoring.service';
import { NationalFootprintReferenceService } from './national-footprint-reference.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizScoringService: QuizScoringService,
    private readonly nationalFootprintReferenceService: NationalFootprintReferenceService,
  ) {}

  /**
   * GET /api/quiz/national-footprint-reference/:quizId
   *
   * Moyennes de référence par catégorie (valeurs pédagogiques cohérentes avec le quiz,
   * ordres de grandeur type empreinte moyenne en France — pas d’appel API externe).
   */
  @Get('national-footprint-reference/:quizId')
  @ApiOperation({
    summary:
      'Référence nationale (empreinte moyenne par habitant et par catégorie)',
  })
  @ApiParam({ name: 'quizId', example: 'quiz-1' })
  async getNationalFootprintReference(@Param('quizId') quizId: string) {
    const quiz = await this.quizScoringService.getQuizPayload(quizId);
    return this.nationalFootprintReferenceService.getNationalReferenceForQuiz(
      quiz.categories ?? [],
    );
  }

  /**
   * GET /api/quiz/onboarding-result
   *
   * Bilan carbone du **dernier** enregistrement score_history, recalculé sans réécriture en base.
   */
  @Get('onboarding-result')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Dernier bilan carbone enregistré (recalcul à la volée)',
  })
  async getOnboardingResult(@CurrentUser() user: any) {
    return this.quizScoringService.getOnboardingDisplayForUser(user.id);
  }

  /**
   * GET /api/quiz/score-history/:id
   *
   * Bilan carbone détaillé pour une entrée `score_history` précise (cliquable depuis l'historique).
   * Recalcule à la volée à partir de `json_answers`, sans réécriture en base. 404 si l'id n'appartient
   * pas à l'utilisateur courant.
   */
  @Get('score-history/:id')
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Détail d’un bilan carbone précis (par score_history.id)',
  })
  @ApiParam({ name: 'id', description: 'Identifiant score_history.' })
  async getScoreHistoryDetail(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.quizScoringService.getDisplayForHistory(user.id, id);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    const data = await this.prisma.quizzes.findUnique({
      where: { id },
    });

    if (data) {
      // On reformate l'objet pour correspondre au type TypeScript 'Quiz' du front
      return {
        id: data.id,
        name: data.name,
        categories: (data.content as any)?.categories || [],
      };
    }

    const localQuiz = this.loadLocalQuizById(id);
    if (localQuiz) {
      return localQuiz;
    }

    throw new NotFoundException(`Quiz avec l'id '${id}' introuvable`);
  }

  private loadLocalQuizById(id: string) {
    const candidatePaths = [
      path.join(process.cwd(), 'src', 'quiz', 'data', 'quiz-init.json'),
      path.join(__dirname, 'data', 'quiz-init.json'),
    ];

    for (const filePath of candidatePaths) {
      if (!fs.existsSync(filePath)) {
        continue;
      }

      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const quizJson = JSON.parse(fileContent) as {
          id?: string;
          name?: string;
          categories?: unknown[];
        };

        if (quizJson.id === id) {
          return {
            id: quizJson.id,
            name: quizJson.name,
            categories: quizJson.categories ?? [],
          };
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * POST /api/quiz/:id/preview
   *
   * Retourne un aperçu de l'empreinte carbone par catégorie à partir de réponses partielles.
   * Pas d'authentification requise, ne persiste aucune donnée.
   */
  @Post(':id/preview')
  async previewScore(
    @Param('id') id: string,
    @Body() body: PreviewQuizScoreDto,
  ) {
    return this.quizScoringService.previewScore(id, body.answers);
  }

  /**
   * POST /api/quiz/:id/score
   *
   * Calcule le score carbone d'un quiz a partir des reponses utilisateur.
   * - Parametre de route : id du quiz (ex: quiz-1)
   * - Body attendu : { answers: { [questionId]: string | number | string[] } }
   *
   * Le calcul est delegue a QuizScoringService qui :
   * - recupere la structure du quiz,
   * - applique la logique de scoring (transport, avion, etc.),
   * - interroge l'API ADEME Base Carbone pour les facteurs d'emission,
   * - utilise des valeurs de repli si aucun facteur n'est trouve.
   *
   * Reponse : total en kgCO2e/an + niveau climatique + detail (breakdown).
   */
  @Post(':id/score')
  @UseGuards(SupabaseAuthGuard)
  @ApiConflictResponse({
    description:
      'Un score est déjà enregistré pour ce mois civil (UTC) ; un seul bilan par mois et par année.',
  })
  async calculateScore(
    @Param('id') id: string,
    @Body() body: CalculateQuizScoreDto,
    @CurrentUser() user: any,
  ) {
    return this.quizScoringService.calculateScore(id, body.answers, user?.id);
  }
}
