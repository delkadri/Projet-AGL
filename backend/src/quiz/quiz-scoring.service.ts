import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AdemeBaseCarboneService, FactorLookupResult } from './ademe-base-carbone.service';
import * as fs from 'fs';
import * as path from 'path';

type QuizQuestion = {
  id: string;
  type: 'single' | 'multiple' | 'number';
  title: string;
  carbonMeta?: {
    poste?: string;
    dataType?: string;
  };
};

type QuizCategory = {
  id: string;
  name: string;
  questions: QuizQuestion[];
};

type QuizPayload = {
  id: string;
  name: string;
  categories: QuizCategory[];
};

type ScoreComponent = {
  key: string;
  label: string;
  valueKgCo2ePerYear: number;
  details: Record<string, unknown>;
};

@Injectable()
export class QuizScoringService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ademeBaseCarboneService: AdemeBaseCarboneService,
  ) {}

  async calculateScore(quizId: string, answers: Record<string, unknown>) {
    const quiz = await this.getQuiz(quizId);
    const questions = this.flattenQuestions(quiz);

    const questionByDataType = new Map<string, QuizQuestion>();
    for (const question of questions) {
      const dataType = question.carbonMeta?.dataType;
      if (dataType) {
        questionByDataType.set(dataType, question);
      }
    }

    const principalMode = this.getSingleAnswer(questionByDataType.get('principal_mode'), answers);
    const distanceBand = this.getSingleAnswer(questionByDataType.get('distance_km'), answers);
    const teleworkBand = this.getSingleAnswer(questionByDataType.get('telework_factor'), answers);
    const flightCount = this.getNumberAnswer(questionByDataType.get('flight_count'), answers) ?? 0;
    const flightDistanceClass = this.getSingleAnswer(
      questionByDataType.get('flight_distance_class'),
      answers,
    );

    const distanceKmPerWeek = this.toDistanceKmPerWeek(distanceBand);
    const teleworkFactor = this.toTeleworkFactor(teleworkBand);

    const breakdown: ScoreComponent[] = [];
    const sourceFactors: Array<FactorLookupResult['source']> = [];

    if (distanceKmPerWeek > 0 && principalMode) {
      const annualDistanceKm = distanceKmPerWeek * 52 * teleworkFactor;
      const transportFactorLookup = await this.ademeBaseCarboneService.findFactorByKeywords(
        this.getTransportSearchKeywords(principalMode),
      );

      const transportFactor = transportFactorLookup?.factor ?? this.getTransportFallbackFactor(principalMode);
      const transportEmission = annualDistanceKm * transportFactor;
      if (transportFactorLookup) {
        sourceFactors.push(transportFactorLookup.source);
      }

      breakdown.push({
        key: 'main-transport',
        label: 'Trajets domicile / activite principale',
        valueKgCo2ePerYear: this.round2(transportEmission),
        details: {
          principalMode,
          distanceKmPerWeek,
          annualDistanceKm: this.round2(annualDistanceKm),
          teleworkFactor,
          emissionFactorKgCo2ePerKm: transportFactor,
          source: transportFactorLookup?.source ?? {
            type: 'fallback',
            reason: 'No ADEME match found',
          },
        },
      });
    }

    if (flightCount > 0) {
      const flightClass = flightDistanceClass ?? 'moyen';
      const averageFlightDistanceKm = this.getAverageFlightDistanceKm(flightClass);
      const flightFactorLookup = await this.ademeBaseCarboneService.findFactorByKeywords(
        this.getFlightSearchKeywords(flightClass),
      );
      const flightFactor = flightFactorLookup?.factor ?? this.getFlightFallbackFactor(flightClass);
      const flightEmission = flightCount * averageFlightDistanceKm * flightFactor;
      if (flightFactorLookup) {
        sourceFactors.push(flightFactorLookup.source);
      }

      breakdown.push({
        key: 'flights',
        label: 'Trajets en avion',
        valueKgCo2ePerYear: this.round2(flightEmission),
        details: {
          flightCount,
          flightClass,
          averageFlightDistanceKm,
          emissionFactorKgCo2ePerPassengerKm: flightFactor,
          source: flightFactorLookup?.source ?? {
            type: 'fallback',
            reason: 'No ADEME match found',
          },
        },
      });
    }

    const total = breakdown.reduce((acc, item) => acc + item.valueKgCo2ePerYear, 0);

    return {
      quizId,
      quizName: quiz.name,
      score: {
        totalKgCo2ePerYear: this.round2(total),
        climateLevel: this.getClimateLevel(total),
      },
      breakdown,
      assumptions: {
        missingDataHandledWithFallbackFactors: true,
        distanceModel: 'distance_km is interpreted as weekly distance, then annualized',
      },
      ademe: {
        dataset: 'base-carboner',
        factorsUsed: sourceFactors,
      },
    };
  }

  private async getQuiz(quizId: string): Promise<QuizPayload> {
    const client = this.supabaseService.getClient();
    if (client) {
      const { data, error } = await client.from('quizzes').select('*').eq('id', quizId).single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          categories: data.content?.categories ?? [],
        };
      }
    }

    const localQuiz = this.loadLocalQuizById(quizId);
    if (localQuiz) {
      return localQuiz;
    }

    throw new NotFoundException(`Quiz avec l'id '${quizId}' introuvable`);
  }

  private loadLocalQuizById(quizId: string): QuizPayload | null {
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
        const quizJson = JSON.parse(fileContent) as QuizPayload;
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

  private flattenQuestions(quiz: QuizPayload): QuizQuestion[] {
    return (quiz.categories ?? []).flatMap((category) => category.questions ?? []);
  }

  private getSingleAnswer(
    question: QuizQuestion | undefined,
    answers: Record<string, unknown>,
  ): string | undefined {
    if (!question) {
      return undefined;
    }

    const value = answers[question.id];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `La reponse de la question '${question.id}' doit etre une chaine (single).`,
      );
    }

    return value;
  }

  private getNumberAnswer(
    question: QuizQuestion | undefined,
    answers: Record<string, unknown>,
  ): number | undefined {
    if (!question) {
      return undefined;
    }

    const value = answers[question.id];
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new BadRequestException(
        `La reponse de la question '${question.id}' doit etre un nombre positif (number).`,
      );
    }

    return value;
  }

  private toDistanceKmPerWeek(distanceBand?: string): number {
    switch (distanceBand) {
      case 'moins_50':
        return 25;
      case '50_100':
        return 75;
      case '100_200':
        return 150;
      case 'plus_200':
        return 250;
      default:
        return 0;
    }
  }

  private toTeleworkFactor(teleworkBand?: string): number {
    switch (teleworkBand) {
      case 'never':
        return 1;
      case '1d':
        return 0.8;
      case '2_3d':
        return 0.6;
      case 'everyday':
        return 0.2;
      default:
        return 1;
    }
  }

  private getTransportSearchKeywords(principalMode: string): string[] {
    const map: Record<string, string[]> = {
      voiture_diesel_essence: ['voiture diesel', 'voiture essence', 'voiture'],
      transport_commun: ['bus urbain', 'metro', 'tramway', 'transport en commun'],
      velo_marche_trottinette: ['velo mecanique', 'marche a pied'],
      covoiturage: ['voiture covoiturage', 'voiture passager.km', 'covoiturage'],
    };

    return map[principalMode] ?? [principalMode];
  }

  private getTransportFallbackFactor(principalMode: string): number {
    const map: Record<string, number> = {
      voiture_diesel_essence: 0.2,
      transport_commun: 0.08,
      velo_marche_trottinette: 0.01,
      covoiturage: 0.1,
    };

    return map[principalMode] ?? 0.12;
  }

  private getFlightSearchKeywords(flightClass: string): string[] {
    const map: Record<string, string[]> = {
      court: ['avion court courrier', 'vol court courrier'],
      moyen: ['avion moyen courrier', 'vol moyen courrier'],
      long: ['avion long courrier', 'vol long courrier'],
    };

    return map[flightClass] ?? ['avion moyen courrier'];
  }

  private getAverageFlightDistanceKm(flightClass: string): number {
    switch (flightClass) {
      case 'court':
        return 800;
      case 'long':
        return 6000;
      case 'moyen':
      default:
        return 2200;
    }
  }

  private getFlightFallbackFactor(flightClass: string): number {
    switch (flightClass) {
      case 'court':
        return 0.25;
      case 'long':
        return 0.18;
      case 'moyen':
      default:
        return 0.2;
    }
  }

  private getClimateLevel(totalKgCo2ePerYear: number): 'low' | 'medium' | 'high' {
    if (totalKgCo2ePerYear < 1500) {
      return 'low';
    }

    if (totalKgCo2ePerYear < 3500) {
      return 'medium';
    }

    return 'high';
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
