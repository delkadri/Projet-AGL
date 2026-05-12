import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
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
import {
  MonthlyQuizCurrentDto,
  MonthlyQuizDataFreshness,
} from './dto/monthly-quiz-current.dto';
import {
  MonthlyQuizCategoryDto,
  MonthlyQuizResponseDto,
} from './dto/monthly-quiz-response.dto';
import { SubmitMonthlyQuizDto } from './dto/submit-monthly-quiz.dto';

const DEFAULT_QUIZ_ID = 'quiz-1';
const MONTHLY_CATEGORY_COUNT = 4;
/** Seuil « données récentes » vs « mise à jour conseillée » (jours depuis le dernier score). */
const DATA_FRESH_DAYS = 21;

type RawQuizCategory = MonthlyQuizCategoryDto;

type RawQuizPayload = {
  id: string;
  name: string;
  categories: MonthlyQuizCategoryDto[];
};

@ApiTags('monthly-quiz')
@ApiBearerAuth()
@ApiExtraModels(MonthlyQuizResponseDto, MonthlyQuizCurrentDto)
@UseGuards(SupabaseAuthGuard)
@Controller('monthly-quiz')
export class MonthlyQuizController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quizScoringService: QuizScoringService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary:
      'Écran quiz du mois : sous-quiz éventuel + métadonnées (dernier score, prochaine ouverture, fraîcheur)',
  })
  @ApiOkResponse({
    description:
      'Enveloppe avec quiz ou null si un bilan (score_history) existe déjà pour le mois civil UTC courant.',
    schema: { $ref: getSchemaPath(MonthlyQuizCurrentDto) },
  })
  async getCurrentMonthlyQuiz(
    @CurrentUser() user: any,
  ): Promise<MonthlyQuizCurrentDto> {
    let dbUser = await this.prisma.users.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        lastMonthlyQuizAt: true,
        nextMonthlyQuizAt: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const now = new Date();
    const hasScoreThisUtcMonth = await this.hasScoreHistoryInUtcMonth(
      user.id,
      now,
    );

    if (
      dbUser.lastMonthlyQuizAt &&
      this.isSameUtcMonth(dbUser.lastMonthlyQuizAt, now) &&
      !hasScoreThisUtcMonth
    ) {
      await this.prisma.users.update({
        where: { id: user.id },
        data: { lastMonthlyQuizAt: null, nextMonthlyQuizAt: null },
      });
      dbUser = { ...dbUser, lastMonthlyQuizAt: null, nextMonthlyQuizAt: null };
    }

    const latestHistory = await this.prisma.score_history.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: { created_at: true, categories_scores: true, json_answers: true },
    });

    const lastScoreHistoryAt = latestHistory?.created_at.toISOString() ?? null;
    const nextMonthlyQuizAt = dbUser.nextMonthlyQuizAt?.toISOString() ?? null;
    const dataFreshness = this.computeDataFreshness(
      latestHistory?.created_at ?? null,
    );
    const baselineAnswers = this.asAnswerRecord(latestHistory?.json_answers);

    /** Aligné sur `calculateScore` : au plus une ligne `score_history` par mois civil UTC. */
    const completedThisUtcMonth = hasScoreThisUtcMonth;

    if (completedThisUtcMonth) {
      return {
        quiz: null,
        lastScoreHistoryAt,
        nextMonthlyQuizAt,
        dataFreshness,
        baselineAnswers,
      };
    }

    const quiz = await this.getQuizPayload(DEFAULT_QUIZ_ID);
    const categories = await this.pickMonthlyCategories(
      quiz,
      latestHistory?.categories_scores as Array<{
        id: string;
        name: string;
        totalKgCo2ePerYear: number;
      }> | null,
      latestHistory?.json_answers as Record<string, unknown> | null,
    );

    return {
      quiz: {
        id: quiz.id,
        name: quiz.name,
        categories,
      },
      lastScoreHistoryAt,
      nextMonthlyQuizAt,
      dataFreshness,
      baselineAnswers,
    };
  }

  /**
   * Simule un passage au mois UTC suivant : données du mois courant recopiées sur le mois précédent
   * puis retirées du mois courant (historique + verrous).
   */
  @Post('dev/simulate-next-month')
  @HttpCode(200)
  @ApiOperation({
    summary:
      '[DEV uniquement] Simule le mois suivant : score_history et verrous du mois UTC courant sont déplacés vers le mois précédent.',
  })
  @ApiOkResponse({
    description:
      'score_history du mois courant clonés en mois précédent puis supprimés ; lastMonthlyQuizAt recalculé.',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean', example: true },
        scoreRowsShifted: { type: 'number', example: 1 },
        monthlyQuizzesUpdated: { type: 'number', example: 0 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Aucune donnée du mois courant à simuler.',
  })
  @ApiForbiddenResponse({
    description: 'Desactive en production (NODE_ENV=production).',
  })
  async devSimulateNextMonth(@CurrentUser() user: any) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Réservé au développement : indisponible lorsque NODE_ENV=production.',
      );
    }

    const dbUser = await this.prisma.users.findUnique({
      where: { id: user.id },
      select: { id: true, lastMonthlyQuizAt: true },
    });
    if (!dbUser) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const now = new Date();
    const monthStart = this.utcMonthStart(now);
    const monthEnd = this.utcMonthEnd(now);

    const histories = await this.prisma.score_history.findMany({
      where: {
        user_id: user.id,
        created_at: { gte: monthStart, lte: monthEnd },
      },
      orderBy: { created_at: 'asc' },
    });

    const L = dbUser.lastMonthlyQuizAt;
    const lockInCurrentMonth = Boolean(L && this.isSameUtcMonth(L, now));
    if (histories.length === 0 && !lockInCurrentMonth) {
      throw new BadRequestException(
        'Aucune donnée du mois UTC courant à simuler (ni score_history ni verrou mensuel sur ce mois).',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let scoreRowsShifted = 0;
      for (let i = 0; i < histories.length; i++) {
        const row = histories[i];
        const shifted = new Date(
          this.shiftToPreviousUtcMonth(row.created_at).getTime() + i * 1000,
        );
        await tx.score_history.create({
          data: {
            user_id: row.user_id,
            score: row.score,
            json_answers: row.json_answers as object,
            categories_scores: row.categories_scores as object,
            created_at: shifted,
          },
        });
        scoreRowsShifted += 1;
      }
      if (histories.length > 0) {
        await tx.score_history.deleteMany({
          where: { id: { in: histories.map((h) => h.id) } },
        });
      }

      const monthlyRows = await tx.monthlyQuiz.findMany({
        where: {
          userId: user.id,
          OR: [
            { scheduledAt: { gte: monthStart, lte: monthEnd } },
            {
              AND: [
                { completedAt: { not: null } },
                { completedAt: { gte: monthStart, lte: monthEnd } },
              ],
            },
          ],
        },
      });

      let monthlyQuizzesUpdated = 0;
      for (const mq of monthlyRows) {
        const data: { scheduledAt?: Date; completedAt?: Date | null } = {};
        if (this.isSameUtcMonth(mq.scheduledAt, now)) {
          data.scheduledAt = this.shiftToPreviousUtcMonth(mq.scheduledAt);
        }
        if (
          mq.completedAt !== null &&
          this.isSameUtcMonth(mq.completedAt, now)
        ) {
          data.completedAt = this.shiftToPreviousUtcMonth(mq.completedAt);
        }
        if (Object.keys(data).length > 0) {
          await tx.monthlyQuiz.update({
            where: { id: mq.id },
            data,
          });
          monthlyQuizzesUpdated += 1;
        }
      }

      let newLast: Date | null = null;
      if (lockInCurrentMonth && L) {
        newLast = this.shiftToPreviousUtcMonth(L);
      } else if (histories.length > 0) {
        const lastHist = histories.reduce((a, b) =>
          a.created_at > b.created_at ? a : b,
        );
        newLast = this.shiftToPreviousUtcMonth(lastHist.created_at);
      }

      const nextMonthlyQuizAt = newLast
        ? this.computeNextMonthlyQuizOpensAt(newLast)
        : null;

      await tx.users.update({
        where: { id: user.id },
        data: {
          lastMonthlyQuizAt: newLast,
          nextMonthlyQuizAt,
        },
      });

      return { scoreRowsShifted, monthlyQuizzesUpdated };
    });

    return {
      ok: true as const,
      scoreRowsShifted: result.scoreRowsShifted,
      monthlyQuizzesUpdated: result.monthlyQuizzesUpdated,
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
      "Score carbone recalcule et enregistre dans l'historique utilisateur.",
  })
  @ApiConflictResponse({
    description: 'Quiz mensuel deja complete ce mois.',
  })
  async submitMonthlyQuiz(
    @Param('id') id: string,
    @Body() body: SubmitMonthlyQuizDto,
    @CurrentUser() user: any,
  ) {
    if (await this.hasScoreHistoryInUtcMonth(user.id, new Date())) {
      throw new ConflictException('Quiz mensuel deja complete ce mois.');
    }

    const latestScore = await this.prisma.score_history.findFirst({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
      select: { json_answers: true },
    });

    const previous =
      latestScore?.json_answers &&
      typeof latestScore.json_answers === 'object' &&
      !Array.isArray(latestScore.json_answers)
        ? (latestScore.json_answers as Record<string, unknown>)
        : {};

    const mergedAnswers: Record<string, unknown> = {
      ...previous,
      ...body.answers,
    };

    const now = new Date();
    const result = await this.quizScoringService.calculateScore(
      id,
      mergedAnswers,
      user?.id,
    );

    await this.prisma.users.update({
      where: { id: user.id },
      data: {
        lastMonthlyQuizAt: now,
        nextMonthlyQuizAt: this.computeNextMonthlyQuizOpensAt(now),
      },
    });

    return result;
  }

  /** Prochaine « ouverture » du quiz mensuel : 1er jour du mois UTC suivant minuit. */
  private computeNextMonthlyQuizOpensAt(from: Date): Date {
    return new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1, 0, 0, 0, 0),
    );
  }

  private computeDataFreshness(
    lastCreatedAt: Date | null,
  ): MonthlyQuizDataFreshness {
    if (!lastCreatedAt) {
      return 'none';
    }
    const ageMs = Date.now() - lastCreatedAt.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    return ageDays <= DATA_FRESH_DAYS ? 'recent' : 'stale';
  }

  private asAnswerRecord(json: unknown): Record<string, unknown> | null {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return null;
    }
    return json as Record<string, unknown>;
  }

  private async pickMonthlyCategories(
    quiz: RawQuizPayload,
    categoriesScores: Array<{
      id: string;
      name: string;
      totalKgCo2ePerYear: number;
    }> | null,
    answers: Record<string, unknown> | null,
  ): Promise<RawQuizCategory[]> {
    const scoredCategories =
      categoriesScores ?? (await this.resolveCategoryScores(quiz, answers));

    if (!scoredCategories) {
      return quiz.categories.slice(0, MONTHLY_CATEGORY_COUNT);
    }

    const worstIds = scoredCategories
      .slice()
      .sort((a, b) => (b.totalKgCo2ePerYear ?? 0) - (a.totalKgCo2ePerYear ?? 0))
      .slice(0, MONTHLY_CATEGORY_COUNT)
      .map((category) => category.id);

    const categoryById = new Map(
      quiz.categories.map((category) => [category.id, category]),
    );
    const selected = worstIds
      .map((categoryId) => categoryById.get(categoryId))
      .filter((category): category is RawQuizCategory => Boolean(category));

    return selected.length > 0
      ? selected
      : quiz.categories.slice(0, MONTHLY_CATEGORY_COUNT);
  }

  private async resolveCategoryScores(
    quiz: RawQuizPayload,
    answers: Record<string, unknown> | null,
  ): Promise<Array<{
    id: string;
    name: string;
    totalKgCo2ePerYear: number;
  }> | null> {
    if (!answers || typeof answers !== 'object') {
      return null;
    }
    const preview = await this.quizScoringService.previewScore(
      quiz.id,
      answers,
    );
    return preview.categories;
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

  private async hasScoreHistoryInUtcMonth(
    userId: string,
    ref: Date,
  ): Promise<boolean> {
    const monthStart = this.utcMonthStart(ref);
    const monthEnd = this.utcMonthEnd(ref);
    const row = await this.prisma.score_history.findFirst({
      where: {
        user_id: userId,
        created_at: { gte: monthStart, lte: monthEnd },
      },
      select: { id: true },
    });
    return row !== null;
  }

  private isSameUtcMonth(left: Date, right: Date): boolean {
    return (
      left.getUTCFullYear() === right.getUTCFullYear() &&
      left.getUTCMonth() === right.getUTCMonth()
    );
  }

  private utcMonthStart(ref: Date): Date {
    return new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1, 0, 0, 0, 0),
    );
  }

  private utcMonthEnd(ref: Date): Date {
    return new Date(
      Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );
  }

  /** Même jour / heure (jour clampé) dans le mois UTC précédent. */
  private shiftToPreviousUtcMonth(d: Date): Date {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    const h = d.getUTCHours();
    const min = d.getUTCMinutes();
    const s = d.getUTCSeconds();
    const ms = d.getUTCMilliseconds();
    const lastDayPrev = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const clampedDay = Math.min(day, lastDayPrev);
    return new Date(Date.UTC(y, m - 1, clampedDay, h, min, s, ms));
  }
}
