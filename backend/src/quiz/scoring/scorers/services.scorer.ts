import { Injectable } from '@nestjs/common';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

/**
 * Scorer Services & Finances (épargne).
 *
 * L'empreinte de l'épargne correspond à l'impact carbone des activités financées
 * (placements en actions, obligations, etc.). Banque classique = financement d'activités
 * carbonées ; fonds ISR / banque éthique = moindre impact.
 * Source : méthodologie ADEME, études empreinte carbone de l'épargne.
 */
@Injectable()
export class ServicesScorer {
  compute(ctx: ScorerContext): BreakdownItem[] {
    const item = this.computeSavings(ctx);
    return item ? [item] : [];
  }

  private computeSavings(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const volume = getSingleAnswer(
      questionByDataType.get('savings_volume'),
      answers,
    );
    if (!volume || volume === 'moins_10k') return null;

    const greenRatio = getSingleAnswer(
      questionByDataType.get('savings_green_ratio'),
      answers,
    );

    const emission = this.toSavingsEmission(volume, greenRatio);
    const categoryId = dataTypeToCategoryId.get('savings_volume') ?? '';

    return {
      key: 'services-savings',
      label: 'Impact de l\'épargne (activités financées)',
      valueKgCo2ePerYear: round2(emission),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: emission,
        factorUnit: 'kgCO2e/an',
        ademeReference: 'ADEME — Empreinte carbone de l\'épargne',
        formula: `Épargne ${volume}, orientation ${greenRatio ?? 'n/a'} → ${round2(emission)} kgCO2e/an`,
      },
    };
  }

  /**
   * Émission annuelle estimée de l'épargne (impact indirect des placements).
   * Plus le montant est élevé et plus la banque/fonds est "classique", plus l'empreinte est forte.
   */
  private toSavingsEmission(volume: string, greenRatio?: string): number {
    const volumeFactor = volume === 'plus_50k' ? 1.5 : 1;
    const greenFactor = this.getGreenRatioFactor(greenRatio);
    const base = 150; // kgCO2e/an pour 10k-50k en classique
    return base * volumeFactor * greenFactor;
  }

  private getGreenRatioFactor(ratio?: string): number {
    switch (ratio) {
      case 'ethique':
        return 0.15;
      case 'mixte':
        return 0.5;
      case 'classique':
      default:
        return 1;
    }
  }
}
