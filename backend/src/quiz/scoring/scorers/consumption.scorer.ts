import { Injectable, Logger } from '@nestjs/common';
import { AdemeBaseCarboneService } from '../../ademe-base-carbone.service';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

/**
 * Scorer Consommation.
 *
 * Stratégie :
 *  - Vêtements : tente une recherche ADEME (kgCO2e/kg textile), sinon ADEME Base Empreinte.
 *  - Électronique : recherche ADEME pour smartphone/ordinateur (kgCO2e/unité), sinon ADEME Base Empreinte.
 *  - La pratique seconde main est appliquée comme réducteur sur l'ensemble.
 */
@Injectable()
export class ConsumptionScorer {
  private readonly logger = new Logger(ConsumptionScorer.name);

  constructor(private readonly ademe: AdemeBaseCarboneService) {}

  async compute(ctx: ScorerContext): Promise<BreakdownItem[]> {
    const results = await Promise.all([
      Promise.resolve(this.computeClothes(ctx)),
      this.computeElectronics(ctx),
      Promise.resolve(this.computeFurniture(ctx)),
    ]);
    return results.filter((item): item is BreakdownItem => item !== null);
  }

  // ---------------------------------------------------------------------------
  // Vêtements
  // ---------------------------------------------------------------------------

  private computeClothes(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const clothesBand = getSingleAnswer(
      questionByDataType.get('new_clothes_per_year'),
      answers,
    );
    const secondHandBand = getSingleAnswer(
      questionByDataType.get('second_hand_practice'),
      answers,
    );

    if (!clothesBand) return null;

    const secondHandDiscount = this.getSecondHandDiscount(secondHandBand);

    // L'API ADEME Base Carbone retourne des matériaux industriels pour les mots-clés textiles.
    // Utilisation directe des valeurs ADEME Base Empreinte 2024 (étude ACV officielle, ~25 kgCO2e/kg coton).
    const baseEmission = this.getClothesBaseEmission(clothesBand);
    const emission = round2(baseEmission * (1 - secondHandDiscount));
    const categoryId = dataTypeToCategoryId.get('new_clothes_per_year') ?? '';

    return {
      key: 'consumption-clothes',
      label: 'Vêtements',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte' as const,
        factorValue: baseEmission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte 2024)',
        ademeReference: 'ADEME Base Empreinte 2024 — Textile',
        formula: `${clothesBand}: ${baseEmission} kgCO2e/an × (1 − occasion ${Math.round(secondHandDiscount * 100)}%) = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Électronique
  // ---------------------------------------------------------------------------

  private async computeElectronics(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const electronicsBand = getSingleAnswer(
      questionByDataType.get('electronics_frequency'),
      answers,
    );
    const secondHandBand = getSingleAnswer(
      questionByDataType.get('second_hand_practice'),
      answers,
    );

    if (!electronicsBand) return null;

    const secondHandDiscount = this.getSecondHandDiscount(secondHandBand);

    // Recherche ADEME pour un smartphone et un ordinateur portable
    const [smartphoneLookup, laptopLookup] = await Promise.all([
      this.ademe.findFactorByKeywords(
        ['téléphone portable', 'smartphone', 'téléphone mobile'],
        { minFactor: 20, maxFactor: 500 },
      ),
      this.ademe.findFactorByKeywords(
        ['ordinateur portable', 'laptop', 'ordinateur'],
        { minFactor: 50, maxFactor: 1000 },
      ),
    ]);

    const smartphoneEmission = smartphoneLookup?.factor ?? 70; // ADEME Base Empreinte
    const laptopEmission = laptopLookup?.factor ?? 300; // ADEME Base Empreinte

    const factorSource =
      smartphoneLookup || laptopLookup
        ? ('ademe-api' as const)
        : ('ademe-empreinte' as const);

    if (!smartphoneLookup) {
      this.logger.warn(
        `[Consumption] Fallback smartphone: ${smartphoneEmission} kgCO2e/unité`,
      );
    }
    if (!laptopLookup) {
      this.logger.warn(
        `[Consumption] Fallback ordinateur: ${laptopEmission} kgCO2e/unité`,
      );
    }

    // Calcul basé sur la fréquence d'achat
    const { annualSmartphone, annualLaptop } =
      this.toDevicePurchaseRate(electronicsBand);
    const rawEmission =
      annualSmartphone * smartphoneEmission + annualLaptop * laptopEmission;
    const emission = round2(rawEmission * (1 - secondHandDiscount));

    const categoryId = dataTypeToCategoryId.get('electronics_frequency') ?? '';

    return {
      key: 'consumption-electronics',
      label: 'Appareils électroniques',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: rawEmission,
        factorUnit: 'kgCO2e/an',
        ademeReference: smartphoneLookup
          ? `Smartphone: ${smartphoneLookup.source.baseName ?? '?'}`
          : undefined,
        formula: `(${annualSmartphone} smartphone × ${smartphoneEmission} kg + ${annualLaptop} ordi × ${laptopEmission} kg) × (1 − occasion ${Math.round(secondHandDiscount * 100)}%) = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Meubles et équipement maison
  // ---------------------------------------------------------------------------

  private computeFurniture(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const furnitureBand = getSingleAnswer(
      questionByDataType.get('furniture_purchase_frequency'),
      answers,
    );
    if (!furnitureBand) return null;

    const emission = this.getFurnitureAnnualEmission(furnitureBand);
    const categoryId =
      dataTypeToCategoryId.get('furniture_purchase_frequency') ?? '';

    if (emission === 0) return null;

    return {
      key: 'consumption-furniture',
      label: 'Meubles et équipement maison',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte' as const,
        factorValue: emission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte)',
        ademeReference: 'ADEME Base Empreinte — Meubles',
        formula: `Fréquence "${furnitureBand}" → ${emission} kgCO2e/an (amorti)`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Émission annuelle amortie pour les meubles (ADEME Base Empreinte, ordre de grandeur).
   */
  private getFurnitureAnnualEmission(band?: string): number {
    switch (band) {
      case 'rare':
        return 20;
      case 'occasion':
        return 80;
      case 'neuf_regulier':
        return 200;
      default:
        return 0;
    }
  }

  private toAnnualClothesItems(band?: string): number {
    switch (band) {
      case 'peu':
        return 3;
      case 'moyen':
        return 10;
      case 'beaucoup':
        return 20;
      default:
        return 8;
    }
  }

  /** Émissions de base annuelles pour les vêtements (ADEME Base Empreinte). */
  private getClothesBaseEmission(band?: string): number {
    switch (band) {
      case 'peu':
        return 120;
      case 'moyen':
        return 300;
      case 'beaucoup':
        return 600;
      default:
        return 200;
    }
  }

  /**
   * Estimation de la fréquence annuelle d'achat de devices.
   * Répartition smartphone/laptop basée sur les habitudes moyennes (ADEME 2023).
   */
  private toDevicePurchaseRate(band?: string): {
    annualSmartphone: number;
    annualLaptop: number;
  } {
    switch (band) {
      case 'jamais':
        return { annualSmartphone: 0.1, annualLaptop: 0.05 };
      case 'rarement':
        return { annualSmartphone: 0.3, annualLaptop: 0.2 };
      case 'parfois':
        return { annualSmartphone: 0.5, annualLaptop: 0.3 };
      case 'souvent':
        return { annualSmartphone: 1.0, annualLaptop: 0.5 };
      default:
        return { annualSmartphone: 0.3, annualLaptop: 0.2 };
    }
  }

  private getSecondHandDiscount(band?: string): number {
    switch (band) {
      case 'toujours':
        return 0.45;
      case 'souvent':
        return 0.25;
      case 'parfois':
        return 0.1;
      default:
        return 0;
    }
  }
}
