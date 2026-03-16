import { Injectable, Logger } from '@nestjs/common';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

/**
 * Scorer Numérique.
 *
 * L'empreinte numérique se décompose en :
 *  1. Fabrication des appareils (dominant ~80 % de l'empreinte numérique)
 *  2. Usage réseau & data centers (streaming)
 *
 * Source : ADEME — Empreinte environnementale du numérique en France 2023.
 * Note : Les facteurs pour le streaming (data centers + réseau) sont trop faibles
 * pour être dans la Base Carbone par kWh — on utilise les valeurs de l'étude ADEME.
 */
@Injectable()
export class DigitalScorer {
  private readonly logger = new Logger(DigitalScorer.name);

  compute(ctx: ScorerContext): BreakdownItem[] {
    const results = [
      this.computeDeviceManufacturing(ctx),
      this.computeStreaming(ctx),
      this.computeVisio(ctx),
      this.computeCloudStorage(ctx),
      this.computeTV(ctx),
    ];
    return results.filter((item): item is BreakdownItem => item !== null);
  }

  // ---------------------------------------------------------------------------
  // Fabrication des appareils (renouvellement)
  // ---------------------------------------------------------------------------

  private computeDeviceManufacturing(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const renewalBand = getSingleAnswer(
      questionByDataType.get('device_renewal'),
      answers,
    );
    if (!renewalBand) return null;

    /**
     * Empreinte fabrication amortie sur la durée de vie estimée.
     * Valeurs ADEME Base Empreinte 2023 :
     *  - Smartphone : 70 kgCO2e / 3 ans = 23 kgCO2e/an
     *  - Ordinateur portable : 300 kgCO2e / 5 ans = 60 kgCO2e/an
     *  - TV 50" : 400 kgCO2e / 7 ans = 57 kgCO2e/an
     *  On suppose un foyer "type" (smartphone + part de PC + part de TV).
     */
    const annualEmission = this.toAnnualDeviceEmission(renewalBand);
    const categoryId = dataTypeToCategoryId.get('device_renewal') ?? '';

    return {
      key: 'digital-devices',
      label: 'Fabrication des appareils numériques',
      valueKgCo2ePerYear: annualEmission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: annualEmission,
        factorUnit: 'kgCO2e/an (ADEME 2023)',
        formula: `Renouvellement "${renewalBand}" → ${annualEmission} kgCO2e/an (fabrication amortie)`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Streaming vidéo
  // ---------------------------------------------------------------------------

  private computeStreaming(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const streamingBand = getSingleAnswer(
      questionByDataType.get('streaming_hours_per_week'),
      answers,
    );
    if (!streamingBand) return null;

    const hoursPerWeek = this.toHoursPerWeek(streamingBand);
    const annualHours = hoursPerWeek * 52;

    /**
     * Facteur ADEME (étude 2023) : 0.036 kgCO2e/h de streaming vidéo HD.
     * Inclut réseau + data center (hors fabrication terminal, scorée séparément).
     * Note : ADEME a revu ce chiffre en baisse par rapport à 2020 (~0.4 kgCO2e/h).
     */
    const factorKgPerHour = 0.036;
    const emission = round2(annualHours * factorKgPerHour);
    const categoryId =
      dataTypeToCategoryId.get('streaming_hours_per_week') ?? '';

    if (hoursPerWeek === 0) return null;

    return {
      key: 'digital-streaming',
      label: 'Streaming vidéo (réseau + data centers)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: factorKgPerHour,
        factorUnit: 'kgCO2e/h',
        formula: `${hoursPerWeek} h/sem × 52 = ${annualHours} h/an × ${factorKgPerHour} kgCO2e/h = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Visioconférence
  // ---------------------------------------------------------------------------

  private computeVisio(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const visioBand = getSingleAnswer(
      questionByDataType.get('visio_hours_per_week'),
      answers,
    );
    if (!visioBand) return null;

    const hoursPerWeek = this.toVisioHoursPerWeek(visioBand);
    const annualHours = hoursPerWeek * 52;

    /**
     * Facteur ADEME (étude 2023) : ordre de grandeur similaire au streaming vidéo,
     * visio HD ~0.03–0.04 kgCO2e/h (réseau + data center).
     */
    const factorKgPerHour = 0.035;
    const emission = round2(annualHours * factorKgPerHour);
    const categoryId =
      dataTypeToCategoryId.get('visio_hours_per_week') ?? '';

    if (hoursPerWeek === 0) return null;

    return {
      key: 'digital-visio',
      label: 'Visioconférence (réseau + data centers)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: factorKgPerHour,
        factorUnit: 'kgCO2e/h',
        formula: `${hoursPerWeek} h/sem × 52 = ${annualHours} h/an × ${factorKgPerHour} kgCO2e/h = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Stockage cloud
  // ---------------------------------------------------------------------------

  private computeCloudStorage(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const cloudBand = getSingleAnswer(
      questionByDataType.get('cloud_storage_usage'),
      answers,
    );
    if (!cloudBand) return null;

    const emission = this.toCloudStorageEmission(cloudBand);
    const categoryId = dataTypeToCategoryId.get('cloud_storage_usage') ?? '';

    if (emission === 0) return null;

    return {
      key: 'digital-cloud',
      label: 'Stockage cloud (data centers)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: emission,
        factorUnit: 'kgCO2e/an',
        formula: `Usage "${cloudBand}" → ${emission} kgCO2e/an (estimation data center)`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Télévision (fabrication — taille d'écran)
  // ---------------------------------------------------------------------------

  private computeTV(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const tvSize = getSingleAnswer(
      questionByDataType.get('tv_screen_size'),
      answers,
    );
    if (!tvSize || tvSize === 'none') return null;

    const emission = this.toTVAnnualEmission(tvSize);
    const categoryId = dataTypeToCategoryId.get('tv_screen_size') ?? '';

    return {
      key: 'digital-tv',
      label: 'Télévision (fabrication)',
      valueKgCo2ePerYear: round2(emission),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: emission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte)',
        ademeReference: 'ADEME — Empreinte numérique, écrans',
        formula: `TV "${tvSize}" → ${round2(emission)} kgCO2e/an (fabrication amortie)`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Émission annuelle amortie de la TV selon la taille d'écran (fabrication dominante).
   * ADEME : petite ~25 kgCO2e/an, moyenne ~57, grande ~85 (durée de vie ~7 ans).
   */
  private toTVAnnualEmission(size: string): number {
    switch (size) {
      case 'none':
        return 0;
      case 'petite':
        return 25;
      case 'moyenne':
        return 57;
      case 'grande':
        return 85;
      default:
        return 0;
    }
  }

  /**
   * Émission annuelle amortie selon la fréquence de renouvellement des appareils.
   * Source : ADEME Base Empreinte 2023.
   */
  private toAnnualDeviceEmission(band: string): number {
    switch (band) {
      case 'jamais':
        // Appareils très vieux, durée de vie > 10 ans → ~30 kgCO2e/an
        return 30;
      case 'tous_5ans':
        // Renouvellement long → ~80 kgCO2e/an
        return 80;
      case 'tous_3ans':
        // Renouvellement moyen (référence nationale) → ~140 kgCO2e/an
        return 140;
      case 'tous_ans':
        // Renouvellement fréquent → ~260 kgCO2e/an
        return 260;
      default:
        return 120;
    }
  }

  private toHoursPerWeek(band: string): number {
    switch (band) {
      case 'moins_5':
        return 2.5;
      case '5_15':
        return 10;
      case '15_30':
        return 22;
      case 'plus_30':
        return 40;
      default:
        return 0;
    }
  }

  private toVisioHoursPerWeek(band: string): number {
    switch (band) {
      case 'moins_2':
        return 1;
      case '2_5':
        return 3.5;
      case '5_10':
        return 7.5;
      case 'plus_10':
        return 15;
      default:
        return 0;
    }
  }

  /**
   * Émission annuelle estimée pour le stockage cloud (data centers).
   * ADEME / études ACV : ordre de grandeur ~5–15 kgCO2e/an pour usage modéré.
   */
  private toCloudStorageEmission(band: string): number {
    switch (band) {
      case 'peu':
        return 5;
      case 'moyen':
        return 25;
      case 'beaucoup':
        return 60;
      default:
        return 0;
    }
  }
}
