import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';

import { SupabaseService } from '../supabase/supabase.service';
import { TransportScorer } from './scoring/scorers/transport.scorer';
import { HousingScorer } from './scoring/scorers/housing.scorer';
import { FoodScorer } from './scoring/scorers/food.scorer';
import { ConsumptionScorer } from './scoring/scorers/consumption.scorer';
import { DigitalScorer } from './scoring/scorers/digital.scorer';
import { ServicesScorer } from './scoring/scorers/services.scorer';
import {
  QuizPayload,
  QuizCategory,
  QuizQuestion,
  BreakdownItem,
  CategoryBilan,
  ScorerContext,
} from './scoring/scoring.types';

/** Part fixe ADEME : services publics (hôpitaux, routes, écoles, administration) — 1.1 à 1.5 tCO2e/hab/an. Ajoutée de manière invisible au total. */
const PUBLIC_SERVICES_FIXED_KG = 1300;

@Injectable()
export class QuizScoringService {
  private readonly logger = new Logger(QuizScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transportScorer: TransportScorer,
    private readonly housingScorer: HousingScorer,
    private readonly foodScorer: FoodScorer,
    private readonly consumptionScorer: ConsumptionScorer,
    private readonly digitalScorer: DigitalScorer,
    private readonly servicesScorer: ServicesScorer,
  ) { }

  async calculateScore(quizId: string, answers: Record<string, unknown>, userId?: string) {
    const quiz = await this.getQuiz(quizId);

    // ── Diagnostic ──────────────────────────────────────────────────────────
    this.logger.log(
      `[Score] Quiz chargé: ${quiz.id} — ${quiz.categories.length} catégories, ` +
      `${quiz.categories.flatMap((c) => c.questions).length} questions`,
    );
    this.logger.log(
      `[Score] Réponses reçues (${Object.keys(answers).length} clés): ${JSON.stringify(answers)}`,
    );
    const ctx = this.buildScorerContext(quiz, answers);
    const dtMap: Record<string, string> = {};
    ctx.questionByDataType.forEach((q, k) => { dtMap[k] = q.id; });
    this.logger.log(`[Score] questionByDataType: ${JSON.stringify(dtMap)}`);
    // ────────────────────────────────────────────────────────────────────────

    // Chaque scorer est indépendant et peut être exécuté en parallèle.
    // Pour ajouter un nouveau poste, créer un scorer dans scoring/scorers/
    // et l'injecter ici.
    const breakdownChunks = await Promise.all([
      this.transportScorer.compute(ctx),
      this.housingScorer.compute(ctx),
      Promise.resolve(this.foodScorer.compute(ctx)),
      this.consumptionScorer.compute(ctx),
      Promise.resolve(this.digitalScorer.compute(ctx)),
      Promise.resolve(this.servicesScorer.compute(ctx)),
    ]);

    const breakdown: BreakdownItem[] = breakdownChunks.flat();
    this.logger.log(
      `[Score] Breakdown (${breakdown.length} postes): ${JSON.stringify(breakdown.map((i) => ({ key: i.key, kg: i.valueKgCo2ePerYear, catId: i.categoryId })))}`,
    );

    const totalFromBreakdown = breakdown.reduce(
      (acc, item) => acc + item.valueKgCo2ePerYear,
      0,
    );
    const total = totalFromBreakdown + PUBLIC_SERVICES_FIXED_KG;
    const categories = this.buildCategoriesBilan(quiz, breakdown);

    if (userId) {
      await this.prisma.score_history.create({
        data: {
          user_id: userId,
          score: this.round2(total),
          json_answers: answers as any,
        }
      });
    }

    return {
      quizId,
      quizName: quiz.name,
      score: {
        totalKgCo2ePerYear: this.round2(total),
        climateLevel: this.getClimateLevel(total),
        /** Part fixe ADEME : services publics (hôpitaux, routes, écoles…) — affichée dans le bilan. */
        publicServicesFixedKg: PUBLIC_SERVICES_FIXED_KG,
      },
      categories,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private buildScorerContext(
    quiz: QuizPayload,
    answers: Record<string, unknown>,
  ): ScorerContext {
    const questionByDataType = new Map<string, QuizQuestion>();
    const dataTypeToCategoryId = new Map<string, string>();

    for (const category of quiz.categories ?? []) {
      for (const question of category.questions ?? []) {
        const dataType = question.carbonMeta?.dataType;
        if (dataType) {
          questionByDataType.set(dataType, question);
          dataTypeToCategoryId.set(dataType, category.id);
        }
      }
    }

    return { answers, questionByDataType, dataTypeToCategoryId };
  }

  private buildCategoriesBilan(
    quiz: QuizPayload,
    breakdown: BreakdownItem[],
  ): CategoryBilan[] {
    const result: CategoryBilan[] = [];
    const categoryById = new Map(
      (quiz.categories ?? []).map((c) => [c.id, c] as [string, QuizCategory]),
    );

    for (const cat of quiz.categories ?? []) {
      const items = breakdown
        .filter((item) => item.categoryId === cat.id)
        .map(({ key, label, valueKgCo2ePerYear, debug }) => ({
          key,
          label,
          valueKgCo2ePerYear,
          debug,
        }));
      if (items.length > 0) {
        result.push({ id: cat.id, name: cat.name, items });
      }
    }

    const others = breakdown.filter(
      (item) => !item.categoryId || !categoryById.has(item.categoryId),
    );
    if (others.length > 0) {
      result.push({
        id: '__others__',
        name: 'Autres',
        items: others.map(({ key, label, valueKgCo2ePerYear, debug }) => ({
          key,
          label,
          valueKgCo2ePerYear,
          debug,
        })),
      });
    }

    return result;
  }

  private async getQuiz(quizId: string): Promise<QuizPayload> {
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

  private loadLocalQuizById(quizId: string): QuizPayload | null {
    const candidatePaths = [
      path.join(process.cwd(), 'src', 'quiz', 'data', 'quiz-init.json'),
      path.join(__dirname, 'data', 'quiz-init.json'),
    ];

    for (const filePath of candidatePaths) {
      if (!fs.existsSync(filePath)) continue;
      try {
        const quizJson = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as QuizPayload;
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

  /**
   * Niveaux selon l'empreinte carbone moyenne française (~10 tCO2e/an).
   * Objectif Accords de Paris : 2 tCO2e/an.
   */
  private getClimateLevel(
    totalKgCo2ePerYear: number,
  ): 'low' | 'medium' | 'high' {
    if (totalKgCo2ePerYear < 3000) return 'low';
    if (totalKgCo2ePerYear < 7000) return 'medium';
    return 'high';
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
