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
import { CalculateQuizScoreDto } from './dto/calculate-quiz-score.dto';
import { QuizScoringService } from './quiz-scoring.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizScoringService: QuizScoringService,
  ) { }

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
  async calculateScore(
    @Param('id') id: string,
    @Body() body: CalculateQuizScoreDto,
    @CurrentUser() user: any
  ) {
    return this.quizScoringService.calculateScore(id, body.answers, user?.id);
  }
}
