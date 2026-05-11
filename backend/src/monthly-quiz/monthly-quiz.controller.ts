import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { QuizScoringService } from '../quiz/quiz-scoring.service';
import { MonthlyQuizCategoryDto, MonthlyQuizResponseDto } from './dto/monthly-quiz-response.dto';
import { SubmitMonthlyQuizDto } from './dto/submit-monthly-quiz.dto';

const DEFAULT_QUIZ_ID = 'quiz-1';
const MONTHLY_CATEGORY_COUNT = 4;

type RawQuizCategory = MonthlyQuizCategoryDto;

type RawQuizPayload = {
  id: string;
  name: string;
  categories: MonthlyQuizCategoryDto[];
};

@ApiTags('monthly-quiz')
@ApiBearerAuth()
@ApiExtraModels(MonthlyQuizResponseDto)
@UseGuards(SupabaseAuthGuard)
@Controller('monthly-quiz')
export class MonthlyQuizController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizScoringService: QuizScoringService,
  ) { }

  @Get('current')
  @ApiOperation({
    summary:
      'Retourne le quiz mensuel (questions des 4 pires categories) ou null si deja complete',
  })
  @ApiOkResponse({
    description:
      'Quiz du mois ou null si le quiz mensuel a deja ete complete ce mois.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(MonthlyQuizResponseDto) },
        { type: 'null' },
      ],
    },
  })
  async getCurrentMonthlyQuiz(
    @CurrentUser() user: any,
  ): Promise<MonthlyQuizResponseDto | null> {
    const dbUser = await this.prisma.users.findUnique({
      where: { id: user.id },
      select: { id: true, lastMonthlyQuizAt: true },
    });

    if (!dbUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    if (
      dbUser.lastMonthlyQuizAt &&
      this.isSameUtcMonth(dbUser.lastMonthlyQuizAt, new Date())
    ) {
      return null;
    }

    const quiz = await this.getQuizPayload(DEFAULT_QUIZ_ID);
    const latestScore = await this.prisma.score_history.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: { json_answers: true },
    });

    const categories = await this.pickMonthlyCategories(
      quiz,
      latestScore?.json_answers as Record<string, unknown> | null,
    );

    return {
      id: quiz.id,
      name: quiz.name,
      categories,
    };
  }

  @Post(':id/submit')
  @ApiOperation({
    summary:
      'Soumet les reponses du quiz mensuel et declenche le recalcul du score',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant du quiz (ex: quiz-1).',
  })
  @ApiOkResponse({
    description:
      'Score carbone recalcule et enregistre dans l\'historique utilisateur.',
  })
  @ApiConflictResponse({
    description: 'Quiz mensuel deja complete ce mois.',
  })
  async submitMonthlyQuiz(
    @Param('id') id: string,
    @Body() body: SubmitMonthlyQuizDto,
    @CurrentUser() user: any,
  ) {
    const dbUser = await this.prisma.users.findUnique({
      where: { id: user.id },
      select: { lastMonthlyQuizAt: true },
    });

    if (
      dbUser?.lastMonthlyQuizAt &&
      this.isSameUtcMonth(dbUser.lastMonthlyQuizAt, new Date())
    ) {
      throw new ConflictException('Quiz mensuel deja complete ce mois.');
    }

    const result = await this.quizScoringService.calculateScore(
      id,
      body.answers,
      user?.id,
    );

    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastMonthlyQuizAt: new Date() },
    });

    return result;
  }

  private async pickMonthlyCategories(
    quiz: RawQuizPayload,
    answers: Record<string, unknown> | null,
  ): Promise<RawQuizCategory[]> {
    if (!answers || typeof answers !== 'object') {
      return quiz.categories.slice(0, MONTHLY_CATEGORY_COUNT);
    }

    const preview = await this.quizScoringService.previewScore(
      quiz.id,
      answers,
    );

    const worstIds = preview.categories
      .slice()
      .sort(
        (a, b) => (b.totalKgCo2ePerYear ?? 0) - (a.totalKgCo2ePerYear ?? 0),
      )
      .slice(0, MONTHLY_CATEGORY_COUNT)
      .map((category) => category.id);

    const categoryById = new Map(
      quiz.categories.map((category) => [category.id, category]),
    );
    const selected = worstIds
      .map((categoryId) => categoryById.get(categoryId))
      .filter((category): category is RawQuizCategory => Boolean(category));

    if (selected.length > 0) {
      return selected;
    }

    return quiz.categories.slice(0, MONTHLY_CATEGORY_COUNT);
  }

  private async getQuizPayload(quizId: string): Promise<RawQuizPayload> {
    const data = await this.prisma.quizzes.findUnique({
      where: { id: quizId },
    });

    if (data) {
      return {
        id: data.id,
        name: data.name || '',
        categories: (data.content as any)?.categories ?? [],
      };
    }

    const localQuiz = this.loadLocalQuizById(quizId);
    if (localQuiz) return localQuiz;

    throw new NotFoundException(`Quiz avec l'id '${quizId}' introuvable`);
  }

  private loadLocalQuizById(quizId: string): RawQuizPayload | null {
    const candidatePaths = [
      path.join(process.cwd(), 'src', 'quiz', 'data', 'quiz-init.json'),
      path.join(__dirname, '..', 'quiz', 'data', 'quiz-init.json'),
    ];

    for (const filePath of candidatePaths) {
      if (!fs.existsSync(filePath)) continue;
      try {
        const quizJson = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as RawQuizPayload;
        if (quizJson.id === quizId) {
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

  private isSameUtcMonth(left: Date, right: Date): boolean {
    return (
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth()
    );
  }
}
