import { Injectable } from '@nestjs/common';

import { QuizCategory } from './scoring/scoring.types';

/** Aligné sur la part fixe services publics utilisée dans `QuizScoringService`. */
export const NATIONAL_PUBLIC_SERVICES_KG_CO2E = 1300;

/**
 * Pool « hors services publics » pour une empreinte moyenne indicative (~8,6 t).
 * Les postes par catégorie sont des ordres de grandeur publiés (ADEME / Base Empreinte),
 * **harmonisés au découpage du quiz** pour que la comparaison utilisateur / référence reste lisible.
 * Ce n’est pas une mesure temps réel ni un calage sur le moteur de calcul du quiz.
 */
const REFERENCE_PERSONAL_TOTAL_KG = 8600;

/**
 * Moyennes indicatives kg CO₂e/an par catégorie du quiz `quiz-1` (somme = REFERENCE_PERSONAL_TOTAL_KG).
 */
const NATIONAL_REFERENCE_KG_BY_CATEGORY_ID: Record<string, number> = {
  'cat-transport': 2700,
  'cat-logement': 2600,
  'cat-alimentation': 2050,
  'cat-consommation': 650,
  'cat-numerique': 350,
  'cat-services-epargne': 250,
};

export type NationalComparisonColor = 'green' | 'yellow' | 'red';

export type NationalComparisonLevel = 'below' | 'average' | 'above';

export type CategoryNationalComparison = {
  categoryId: string;
  name: string;
  userKgCo2ePerYear: number;
  nationalAvgKgCo2ePerYear: number;
  ratioVsNational: number;
  comparison: NationalComparisonLevel;
  color: NationalComparisonColor;
};

export type OnboardingBilanNational = {
  nationalTotalKgCo2ePerYear: number;
  nationalPublicServicesKgCo2ePerYear: number;
  personalFootprintPoolKgCo2ePerYear: number;
  dataSource: {
    provider: string;
    datasetId: string;
    rowLabel: string;
    yearColumn: string | null;
    apiUrl: string;
  };
  fetchedAt: string;
  /** Toujours true : les références sont disponibles localement. */
  apiReachable: boolean;
  topCategoriesAboveNational: Array<{
    categoryId: string;
    name: string;
    userKgCo2ePerYear: number;
    nationalAvgKgCo2ePerYear: number;
    excessKgCo2ePerYear: number;
    ratioVsNational: number;
  }>;
  categories: CategoryNationalComparison[];
};

@Injectable()
export class NationalFootprintReferenceService {
  /**
   * Moyennes nationales par catégorie (quiz) + comparaison aux totaux utilisateur par catégorie.
   * Références **pédagogiques** cohérentes (pas d’appel API externe pour ce référentiel).
   */
  async buildOnboardingBilan(
    categories: QuizCategory[],
    userKgByCategoryId: Map<string, number>,
  ): Promise<OnboardingBilanNational> {
    return this.composeOnboardingBilan(categories, userKgByCategoryId);
  }

  /**
   * Repli identique au chemin nominal (références locales).
   */
  buildOnboardingBilanOffline(
    categories: QuizCategory[],
    userKgByCategoryId: Map<string, number>,
  ): OnboardingBilanNational {
    return this.composeOnboardingBilan(categories, userKgByCategoryId);
  }

  /** Moyennes de référence seules (endpoint GET). */
  async getNationalReferenceForQuiz(categories: QuizCategory[]) {
    const refKg = this.referenceKgByCategory(categories);
    const personalPool = this.round2(
      [...refKg.values()].reduce((a, b) => a + b, 0),
    );
    const totalKg = personalPool + NATIONAL_PUBLIC_SERVICES_KG_CO2E;

    return {
      nationalTotalKgCo2ePerYear: totalKg,
      nationalPublicServicesKgCo2ePerYear: NATIONAL_PUBLIC_SERVICES_KG_CO2E,
      personalFootprintPoolKgCo2ePerYear: personalPool,
      dataSource: this.referenceDataSource(),
      fetchedAt: new Date().toISOString(),
      apiReachable: true,
      categories: categories.map((c) => ({
        categoryId: c.id,
        name: c.name,
        nationalAvgKgCo2ePerYear: this.round2(refKg.get(c.id) ?? 0),
      })),
    };
  }

  private composeOnboardingBilan(
    categories: QuizCategory[],
    userKgByCategoryId: Map<string, number>,
  ): OnboardingBilanNational {
    const refKg = this.referenceKgByCategory(categories);
    const personalPool = this.round2(
      [...refKg.values()].reduce((a, b) => a + b, 0),
    );
    const totalKg = personalPool + NATIONAL_PUBLIC_SERVICES_KG_CO2E;
    const comparisons: CategoryNationalComparison[] = [];

    for (const cat of categories) {
      const nationalAvg = this.round2(refKg.get(cat.id) ?? 0);
      const userKg = this.round2(userKgByCategoryId.get(cat.id) ?? 0);
      const ratio =
        nationalAvg > 0 ? userKg / nationalAvg : userKg > 0 ? 10 : 1;
      const { comparison, color } = this.classifyRatio(ratio);

      comparisons.push({
        categoryId: cat.id,
        name: cat.name,
        userKgCo2ePerYear: userKg,
        nationalAvgKgCo2ePerYear: nationalAvg,
        ratioVsNational: this.round2(ratio),
        comparison,
        color,
      });
    }

    const topAbove = [...comparisons]
      .filter((c) => c.userKgCo2ePerYear > c.nationalAvgKgCo2ePerYear)
      .sort(
        (a, b) =>
          b.userKgCo2ePerYear -
          b.nationalAvgKgCo2ePerYear -
          (a.userKgCo2ePerYear - a.nationalAvgKgCo2ePerYear),
      )
      .slice(0, 5)
      .map((c) => ({
        categoryId: c.categoryId,
        name: c.name,
        userKgCo2ePerYear: c.userKgCo2ePerYear,
        nationalAvgKgCo2ePerYear: c.nationalAvgKgCo2ePerYear,
        excessKgCo2ePerYear: this.round2(
          c.userKgCo2ePerYear - c.nationalAvgKgCo2ePerYear,
        ),
        ratioVsNational: c.ratioVsNational,
      }));

    return {
      nationalTotalKgCo2ePerYear: totalKg,
      nationalPublicServicesKgCo2ePerYear: NATIONAL_PUBLIC_SERVICES_KG_CO2E,
      personalFootprintPoolKgCo2ePerYear: personalPool,
      dataSource: this.referenceDataSource(),
      fetchedAt: new Date().toISOString(),
      apiReachable: true,
      topCategoriesAboveNational: topAbove,
      categories: comparisons,
    };
  }

  private referenceDataSource(): OnboardingBilanNational['dataSource'] {
    return {
      provider: 'reference-pedagogique',
      datasetId: 'empreinte-moyenne-fr-postes-quiz',
      rowLabel:
        'Moyennes indicatives par poste (France), harmonisées aux catégories du quiz',
      yearColumn: null,
      apiUrl: '',
    };
  }

  /**
   * Répartition de `REFERENCE_PERSONAL_TOTAL_KG` : poids = valeur tabulée si connue, sinon 1.
   * Toute combinaison de catégories du quiz obtient des moyennes qui somment à la cible (après correction d’arrondi).
   */
  private referenceKgByCategory(
    categories: QuizCategory[],
  ): Map<string, number> {
    const out = new Map<string, number>();
    if (categories.length === 0) return out;

    const weights = categories.map((c) => ({
      id: c.id,
      w: NATIONAL_REFERENCE_KG_BY_CATEGORY_ID[c.id] ?? 1,
    }));
    const sumW = weights.reduce((a, x) => a + x.w, 0);
    for (const { id, w } of weights) {
      out.set(id, this.round2((REFERENCE_PERSONAL_TOTAL_KG * w) / sumW));
    }

    this.normalizePoolToTarget(out, categories);
    return out;
  }

  /** Corrige les arrondis pour que la somme des postes = REFERENCE_PERSONAL_TOTAL_KG. */
  private normalizePoolToTarget(
    out: Map<string, number>,
    categories: QuizCategory[],
  ): void {
    let sum = 0;
    for (const c of categories) {
      sum += out.get(c.id) ?? 0;
    }
    const delta = this.round2(REFERENCE_PERSONAL_TOTAL_KG - sum);
    if (Math.abs(delta) < 0.001) return;
    const firstId = categories[0]?.id;
    if (!firstId) return;
    out.set(firstId, this.round2((out.get(firstId) ?? 0) + delta));
  }

  private classifyRatio(ratio: number): {
    comparison: NationalComparisonLevel;
    color: NationalComparisonColor;
  } {
    if (ratio < 0.9) {
      return { comparison: 'below', color: 'green' };
    }
    if (ratio <= 1.12) {
      return { comparison: 'average', color: 'yellow' };
    }
    return { comparison: 'above', color: 'red' };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
