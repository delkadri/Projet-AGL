import { Injectable } from '@nestjs/common';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

/**
 * Scorer Alimentation.
 *
 * Stratégie de calcul :
 *  - Tous les facteurs utilisent les valeurs ADEME Base Empreinte 2024 (étude ACV officielle).
 *  - L'API ADEME Base Carbone n'est pas utilisée ici car sa recherche textuelle retourne
 *    des correspondances sémantiquement incorrectes pour les aliments.
 *  - Le bonus local/de saison est une réduction forfaitaire (−3 % à −12 %).
 */
@Injectable()
export class FoodScorer {
  compute(ctx: ScorerContext): BreakdownItem[] {
    return [
      this.computeBaseDiet(ctx),
      this.computeRedMeat(ctx),
      this.computeDairy(ctx),
      this.computeBottledWater(ctx),
      this.computeHotDrinksAlcohol(ctx),
    ].filter((item): item is BreakdownItem => item !== null);
  }

  // ---------------------------------------------------------------------------
  // Régime alimentaire de base
  // ---------------------------------------------------------------------------

  private computeBaseDiet(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const dietType = getSingleAnswer(
      questionByDataType.get('diet_type'),
      answers,
    );
    if (!dietType) return null;

    const localFoodShare = getSingleAnswer(
      questionByDataType.get('local_food_share'),
      answers,
    );
    const localDiscount = this.getLocalFoodDiscount(localFoodShare);

    // Base sans viande rouge ni produits laitiers (ceux-ci sont scorés séparément)
    const baseEmission = this.getBaseDietEmission(dietType);
    const emission = round2(baseEmission * (1 - localDiscount));

    const categoryId = dataTypeToCategoryId.get('diet_type') ?? '';

    return {
      key: 'food-base',
      label: 'Alimentation de base',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: baseEmission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte 2024)',
        formula: `Régime ${dietType}: ${baseEmission} kg × (1 − local ${Math.round(localDiscount * 100)}%) = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Ajustement viande rouge
  // ---------------------------------------------------------------------------

  private computeRedMeat(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const frequency = getSingleAnswer(
      questionByDataType.get('red_meat_frequency'),
      answers,
    );
    if (!frequency || frequency === 'jamais') return null;

    const annualKg = this.toAnnualRedMeatKg(frequency);
    if (annualKg === 0) return null;

    // L'API ADEME Base Carbone n'est pas fiable pour les aliments (recherche textuelle trop imprécise).
    // Utilisation directe des valeurs ADEME Base Empreinte 2024 (étude ACV officielle).
    const factor = 25.6; // kgCO2e/kg viande bovine (ADEME Base Empreinte 2024)
    const factorSource = 'ademe-empreinte' as const;
    const factorUnit = 'kgCO2e/kg';
    const emission = round2(annualKg * factor);
    const categoryId = dataTypeToCategoryId.get('red_meat_frequency') ?? '';

    return {
      key: 'food-red-meat',
      label: 'Viande rouge',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: 'ADEME Base Empreinte 2024 — Alimentation',
        formula: `${frequency} → ${annualKg} kg/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Produits laitiers
  // ---------------------------------------------------------------------------

  private computeDairy(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const frequency = getSingleAnswer(
      questionByDataType.get('dairy_frequency'),
      answers,
    );
    if (!frequency || frequency === 'jamais') return null;

    const annualKgEquiv = this.toAnnualDairyKg(frequency);
    if (annualKgEquiv === 0) return null;

    // L'API ADEME Base Carbone n'est pas fiable pour les aliments (recherche textuelle trop imprécise).
    // Utilisation directe des valeurs ADEME Base Empreinte 2024 (étude ACV officielle).
    const factor = 3.5; // kgCO2e/kg (mix lait, fromage, yaourt — ADEME Base Empreinte 2024)
    const factorSource = 'ademe-empreinte' as const;
    const factorUnit = 'kgCO2e/kg éq.';
    const emission = round2(annualKgEquiv * factor);
    const categoryId = dataTypeToCategoryId.get('dairy_frequency') ?? '';

    return {
      key: 'food-dairy',
      label: 'Produits laitiers',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: 'ADEME Base Empreinte 2024 — Alimentation',
        formula: `${frequency} → ${annualKgEquiv} kg éq./an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Eau en bouteille
  // ---------------------------------------------------------------------------

  private computeBottledWater(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const waterChoice = getSingleAnswer(
      questionByDataType.get('bottled_water_consumption'),
      answers,
    );
    if (!waterChoice || waterChoice === 'robinet') return null;

    // ADEME Base Empreinte : eau en bouteille ~0,15–0,2 kgCO2e/L (transport, emballage).
    // Consommation typique ~1,5 L/j → ~550 L/an. Robinet = négligeable.
    const annualEmission = this.getBottledWaterEmission(waterChoice);
    const categoryId =
      dataTypeToCategoryId.get('bottled_water_consumption') ?? '';

    return {
      key: 'food-bottled-water',
      label: 'Eau en bouteille',
      valueKgCo2ePerYear: round2(annualEmission),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: annualEmission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte)',
        ademeReference: 'ADEME Base Empreinte — Boissons',
        formula: `Eau "${waterChoice}" → ${round2(annualEmission)} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Boissons chaudes et alcool
  // ---------------------------------------------------------------------------

  private computeHotDrinksAlcohol(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const level = getSingleAnswer(
      questionByDataType.get('hot_drinks_alcohol'),
      answers,
    );
    if (!level || level === 'faible') return null;

    const annualEmission = this.getHotDrinksAlcoholEmission(level);
    const categoryId = dataTypeToCategoryId.get('hot_drinks_alcohol') ?? '';

    return {
      key: 'food-hot-drinks-alcohol',
      label: 'Boissons chaudes et alcool',
      valueKgCo2ePerYear: round2(annualEmission),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: annualEmission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte)',
        ademeReference: 'ADEME Base Empreinte — Boissons',
        formula: `Consommation "${level}" → ${round2(annualEmission)} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Émission annuelle eau en bouteille (ADEME : emballage + transport).
   * Robinet = 0, mixte = part bouteille, bouteille = 100 %.
   */
  private getBottledWaterEmission(choice: string): number {
    switch (choice) {
      case 'robinet':
        return 0;
      case 'mixte':
        return 40; // ~50 % de la consommation bouteille
      case 'bouteille':
        return 80; // ~550 L/an × 0,15 kgCO2e/L ordre de grandeur
      default:
        return 0;
    }
  }

  /**
   * Émission annuelle café/thé/alcool (ADEME Base Empreinte — boissons).
   */
  private getHotDrinksAlcoholEmission(level: string): number {
    switch (level) {
      case 'faible':
        return 0;
      case 'moderee':
        return 50; // 1–2 tasses/verres par jour
      case 'importante':
        return 120; // 3+ par jour (café, vin, bière)
      default:
        return 0;
    }
  }

  /**
   * Émissions de base par régime (hors viande rouge et produits laitiers).
   * Source : ADEME Base Empreinte 2024.
   */
  private getBaseDietEmission(dietType: string): number {
    const map: Record<string, number> = {
      omnivore: 1400,
      flexitarien: 1200,
      vegetarien: 1050,
      vegan: 900,
    };
    return map[dietType] ?? 1200;
  }

  /** Réduction (0–1) liée à l'alimentation locale/de saison. */
  private getLocalFoodDiscount(share?: string): number {
    switch (share) {
      case 'toujours':
        return 0.12;
      case 'souvent':
        return 0.07;
      case 'parfois':
        return 0.03;
      default:
        return 0;
    }
  }

  /**
   * Consommation annuelle estimée de viande bovine selon la fréquence.
   * Référence : portion standard ~130 g.
   */
  private toAnnualRedMeatKg(frequency: string): number {
    switch (frequency) {
      case 'quotidien':
        return 35; // ~2 portions/jour × 130 g × 365 jours ÷ 2
      case 'plusieurs_semaine':
        return 21; // 3 portions × 130 g × 52 semaines
      case 'une_semaine':
        return 7; // 1 portion × 130 g × 52 semaines
      case 'rarement':
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Consommation annuelle estimée de produits laitiers selon la fréquence (kg éq.).
   * Mix lait + fromage + yaourt.
   */
  private toAnnualDairyKg(frequency: string): number {
    switch (frequency) {
      case 'quotidien':
        return 120; // ~330 g/j × 365
      case 'plusieurs_semaine':
        return 65;
      case 'une_semaine':
        return 20;
      default:
        return 0;
    }
  }
}
