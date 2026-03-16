import { Injectable, Logger } from '@nestjs/common';
import { AdemeBaseCarboneService } from '../../ademe-base-carbone.service';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  getNumberAnswer,
  round2,
} from '../scoring.types';

@Injectable()
export class TransportScorer {
  private readonly logger = new Logger(TransportScorer.name);

  constructor(private readonly ademe: AdemeBaseCarboneService) {}

  async compute(ctx: ScorerContext): Promise<BreakdownItem[]> {
    const results = await Promise.all([
      this.computeMainTransport(ctx),
      this.computeFlights(ctx),
      this.computeTrain(ctx),
      this.computeLeisureCar(ctx),
    ]);
    return results.filter((item): item is BreakdownItem => item !== null);
  }

  // ---------------------------------------------------------------------------
  // Trajets domicile / activité principale
  // ---------------------------------------------------------------------------

  private async computeMainTransport(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const principalMode = getSingleAnswer(
      questionByDataType.get('principal_mode'),
      answers,
    );
    const distanceBand = getSingleAnswer(
      questionByDataType.get('distance_km'),
      answers,
    );
    const teleworkBand = getSingleAnswer(
      questionByDataType.get('telework_factor'),
      answers,
    );
    const fuelType = getSingleAnswer(
      questionByDataType.get('vehicle_fuel_type'),
      answers,
    );

    const distanceKmPerDay = this.toDistanceKmPerDay(distanceBand);
    if (distanceKmPerDay === 0 || !principalMode) return null;

    const teleworkFactor = this.toTeleworkFactor(teleworkBand);
    // 235 jours travaillés/an (52 semaines × 5 jours − congés/jours fériés)
    const workedDaysPerYear = 235;
    const annualDistanceKm =
      distanceKmPerDay * workedDaysPerYear * teleworkFactor;

    // Affine les keywords selon le type de carburant si renseigné
    const keywords = this.getTransportKeywords(principalMode, fuelType);
    const factorLookup = await this.ademe.findFactorByKeywords(keywords, {
      expectedUnitHint: '/km',
      minFactor: 0.001,
      maxFactor: 2.0,
    });

    const factor =
      factorLookup?.factor ??
      this.getTransportFallback(principalMode, fuelType);
    const factorSource = factorLookup
      ? ('ademe-api' as const)
      : ('ademe-empreinte' as const);
    const factorUnit = factorLookup?.source.unit ?? 'kgCO2e/km';

    if (!factorLookup) {
      this.logger.warn(
        `[Transport] Fallback pour mode="${principalMode}" fuel="${fuelType ?? 'n/a'}": ${factor} kgCO2e/km`,
      );
    }

    const emission = round2(annualDistanceKm * factor);
    const categoryId =
      dataTypeToCategoryId.get('principal_mode') ??
      dataTypeToCategoryId.get('distance_km') ??
      '';

    return {
      key: 'main-transport',
      label: 'Trajets domicile / activité principale',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: factorLookup
          ? `${factorLookup.source.baseName ?? '?'} / ${factorLookup.source.attributeName ?? '?'}`
          : undefined,
        formula: `${distanceKmPerDay} km/j × ${workedDaysPerYear} j/an × ${round2(teleworkFactor * 100)}% présence = ${round2(annualDistanceKm)} km/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Trajets en avion
  // ---------------------------------------------------------------------------

  private async computeFlights(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const flightCount =
      getNumberAnswer(questionByDataType.get('flight_count'), answers) ?? 0;
    if (flightCount === 0) return null;

    const flightClass =
      getSingleAnswer(
        questionByDataType.get('flight_distance_class'),
        answers,
      ) ?? 'moyen';
    const avgDistanceKm = this.getAvgFlightDistanceKm(flightClass);

    const factorLookup = await this.ademe.findFactorByKeywords(
      this.getFlightKeywords(flightClass),
      { expectedUnitHint: '/km', minFactor: 0.05, maxFactor: 0.5 },
    );
    const factor = factorLookup?.factor ?? this.getFlightFallback(flightClass);
    const factorSource = factorLookup
      ? ('ademe-api' as const)
      : ('ademe-empreinte' as const);
    const factorUnit = factorLookup?.source.unit ?? 'kgCO2e/passager.km';

    if (!factorLookup) {
      this.logger.warn(
        `[Transport] Fallback avion pour classe="${flightClass}": ${factor} kgCO2e/passager.km`,
      );
    }

    const emission = round2(flightCount * avgDistanceKm * factor);
    const categoryId =
      dataTypeToCategoryId.get('flight_count') ??
      dataTypeToCategoryId.get('flight_distance_class') ??
      '';

    return {
      key: 'flights',
      label: 'Trajets en avion',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: factorLookup
          ? `${factorLookup.source.baseName ?? '?'} / ${factorLookup.source.attributeName ?? '?'}`
          : undefined,
        formula: `${flightCount} vols × ${avgDistanceKm} km × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Train (TGV, Intercités — loisirs / vacances)
  // ---------------------------------------------------------------------------

  private async computeTrain(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const trainBand = getSingleAnswer(
      questionByDataType.get('train_distance_km'),
      answers,
    );
    if (!trainBand) return null;

    const annualKm = this.toTrainDistanceKmPerYear(trainBand);
    if (annualKm === 0) return null;

    const keywords = ['TGV', 'train', 'Intercités', 'train grande ligne'];
    const factorLookup = await this.ademe.findFactorByKeywords(keywords, {
      expectedUnitHint: '/km',
      minFactor: 0.001,
      maxFactor: 0.05,
    });
    const factor = factorLookup?.factor ?? 0.0029; // ADEME ~2.9 gCO2e/km TGV
    const factorSource = factorLookup
      ? ('ademe-api' as const)
      : ('ademe-empreinte' as const);
    const factorUnit = factorLookup?.source.unit ?? 'kgCO2e/km';

    const emission = round2(annualKm * factor);
    const categoryId = dataTypeToCategoryId.get('train_distance_km') ?? '';

    return {
      key: 'train',
      label: 'Train (TGV, Intercités)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: factorLookup
          ? `${factorLookup.source.baseName ?? '?'} / ${factorLookup.source.attributeName ?? '?'}`
          : undefined,
        formula: `${annualKm} km/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Voiture loisirs / vacances
  // ---------------------------------------------------------------------------

  private async computeLeisureCar(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const leisureBand = getSingleAnswer(
      questionByDataType.get('leisure_car_distance_km'),
      answers,
    );
    if (!leisureBand) return null;

    const annualKm = this.toLeisureCarDistanceKmPerYear(leisureBand);
    if (annualKm === 0) return null;

    const keywords = [
      'voiture particulière diesel',
      'voiture essence',
      'voiture particulière',
    ];
    const factorLookup = await this.ademe.findFactorByKeywords(keywords, {
      expectedUnitHint: '/km',
      minFactor: 0.01,
      maxFactor: 0.3,
    });
    const factor = factorLookup?.factor ?? 0.193; // ADEME voiture thermique moyenne
    const factorSource = factorLookup
      ? ('ademe-api' as const)
      : ('ademe-empreinte' as const);
    const factorUnit = factorLookup?.source.unit ?? 'kgCO2e/km';

    const emission = round2(annualKm * factor);
    const categoryId =
      dataTypeToCategoryId.get('leisure_car_distance_km') ?? '';

    return {
      key: 'leisure-car',
      label: 'Voiture (week-ends et vacances)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: factorLookup
          ? `${factorLookup.source.baseName ?? '?'} / ${factorLookup.source.attributeName ?? '?'}`
          : undefined,
        formula: `${annualKm} km/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Distance aller-retour par jour travaillé (km). */
  private toDistanceKmPerDay(band?: string): number {
    switch (band) {
      case 'moins_20':
        return 10;
      case '20_50':
        return 35;
      case '50_100':
        return 75;
      case 'plus_100':
        return 130;
      default:
        return 0;
    }
  }

  private toTeleworkFactor(band?: string): number {
    switch (band) {
      case 'never':
        return 1;
      case '1d':
        return 0.8;
      case '2_3d':
        return 0.5;
      case 'everyday':
        return 0.0;
      default:
        return 1;
    }
  }

  private getTransportKeywords(mode: string, fuelType?: string): string[] {
    if (mode === 'voiture_diesel_essence') {
      switch (fuelType) {
        case 'electrique':
          return ['voiture électrique', 'véhicule électrique'];
        case 'hybride_rechargeable':
          return [
            'véhicule hybride rechargeable',
            'voiture hybride rechargeable',
          ];
        case 'hybride':
          return ['véhicule hybride non rechargeable', 'voiture hybride'];
        case 'essence':
          return ['voiture particulière essence', 'voiture essence'];
        case 'diesel':
        default:
          return [
            'voiture particulière diesel',
            'voiture diesel',
            'voiture particulière',
          ];
      }
    }
    const map: Record<string, string[]> = {
      transport_commun: ['RER', 'métro', 'bus thermique', 'bus urbain'],
      velo_marche_trottinette: [
        'vélo à assistance électrique',
        'vélo mécanique',
        'marche',
      ],
      deux_roues_motorise: ['moto', 'scooter', 'deux-roues motorisé'],
      covoiturage: ['covoiturage', 'voiture passager', 'voiture diesel'],
    };
    return map[mode] ?? [mode];
  }

  /** kgCO2e/km — source ADEME Base Carbone 2024 */
  private getTransportFallback(mode: string, fuelType?: string): number {
    if (mode === 'voiture_diesel_essence') {
      switch (fuelType) {
        case 'electrique':
          return 0.022;
        case 'hybride_rechargeable':
          return 0.095;
        case 'hybride':
          return 0.135;
        case 'essence':
          return 0.193;
        case 'diesel':
        default:
          return 0.193;
      }
    }
    const map: Record<string, number> = {
      transport_commun: 0.029,
      velo_marche_trottinette: 0.0,
      deux_roues_motorise: 0.113, // ADEME moto/scooter moyenne
      covoiturage: 0.097,
    };
    return map[mode] ?? 0.12;
  }

  /** Distance train par an (km) — bandes loisirs/vacances. */
  private toTrainDistanceKmPerYear(band?: string): number {
    switch (band) {
      case 'moins_500':
        return 250;
      case '500_2000':
        return 1250;
      case '2000_10000':
        return 6000;
      case 'plus_10000':
        return 15000;
      default:
        return 0;
    }
  }

  /** Distance voiture loisirs/vacances par an (km). */
  private toLeisureCarDistanceKmPerYear(band?: string): number {
    switch (band) {
      case 'moins_1000':
        return 500;
      case '1000_5000':
        return 3000;
      case '5000_10000':
        return 7500;
      case 'plus_10000':
        return 15000;
      default:
        return 0;
    }
  }

  private getFlightKeywords(cls: string): string[] {
    const map: Record<string, string[]> = {
      court: ['avion court courrier', 'court courrier', 'avion domestique'],
      moyen: ['avion moyen courrier', 'moyen courrier', 'avion européen'],
      long: ['avion long courrier', 'long courrier', 'avion intercontinental'],
    };
    return map[cls] ?? ['avion moyen courrier'];
  }

  /** kgCO2e/passager.km — source ADEME Base Carbone 2024 */
  private getFlightFallback(cls: string): number {
    switch (cls) {
      case 'court':
        return 0.258;
      case 'long':
        return 0.152;
      case 'moyen':
      default:
        return 0.187;
    }
  }

  private getAvgFlightDistanceKm(cls: string): number {
    switch (cls) {
      case 'court':
        return 800;
      case 'long':
        return 6000;
      case 'moyen':
      default:
        return 2200;
    }
  }
}
