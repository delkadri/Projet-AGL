import { Injectable, Logger } from '@nestjs/common';
import { AdemeBaseCarboneService } from '../../ademe-base-carbone.service';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

@Injectable()
export class HousingScorer {
  private readonly logger = new Logger(HousingScorer.name);

  constructor(private readonly ademe: AdemeBaseCarboneService) {}

  async compute(ctx: ScorerContext): Promise<BreakdownItem[]> {
    const results = await Promise.all([
      this.computeHeating(ctx),
      Promise.resolve(this.computeAC(ctx)),
    ]);
    return results.filter((item): item is BreakdownItem => item !== null);
  }

  // ---------------------------------------------------------------------------
  // Chauffage du logement
  // ---------------------------------------------------------------------------

  private async computeHeating(
    ctx: ScorerContext,
  ): Promise<BreakdownItem | null> {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const surfaceBand = getSingleAnswer(
      questionByDataType.get('housing_surface'),
      answers,
    );
    const heatingType = getSingleAnswer(
      questionByDataType.get('heating_type'),
      answers,
    );
    const occupantsBand = getSingleAnswer(
      questionByDataType.get('housing_occupants'),
      answers,
    );
    const insulationBand = getSingleAnswer(
      questionByDataType.get('housing_insulation'),
      answers,
    );
    const constructionEra = getSingleAnswer(
      questionByDataType.get('housing_construction_era'),
      answers,
    );

    if (!surfaceBand || !heatingType) return null;

    const surfaceM2 = this.toSurfaceM2(surfaceBand);
    const occupants = this.toOccupants(occupantsBand);
    // Consommation annuelle par m² : année de construction (norme énergétique) si connue, sinon isolation
    const annualKwhPerM2 = this.toAnnualKwhPerM2(insulationBand, constructionEra);
    const annualKwh = (surfaceM2 * annualKwhPerM2) / occupants;

    // Facteur ADEME attendu en kgCO2e/kWh ; bornes : [0.001, 1.0]
    const factorLookup = await this.ademe.findFactorByKeywords(
      this.getHeatingKeywords(heatingType),
      { expectedUnitHint: '/kWh', minFactor: 0.001, maxFactor: 1.0 },
    );
    const factor = factorLookup?.factor ?? this.getHeatingFallback(heatingType);
    const factorSource = factorLookup
      ? ('ademe-api' as const)
      : ('ademe-empreinte' as const);
    const factorUnit = factorLookup?.source.unit ?? 'kgCO2e/kWh';

    if (!factorLookup) {
      this.logger.warn(
        `[Housing] Fallback chauffage pour type="${heatingType}": ${factor} kgCO2e/kWh`,
      );
    }

    const emission = round2(annualKwh * factor);
    const categoryId = dataTypeToCategoryId.get('housing_surface') ?? '';

    return {
      key: 'housing-heating',
      label: 'Chauffage du logement',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource,
        factorValue: factor,
        factorUnit,
        ademeReference: factorLookup
          ? `${factorLookup.source.baseName ?? '?'} / ${factorLookup.source.attributeName ?? '?'}`
          : undefined,
        formula: `${surfaceM2} m² × ${annualKwhPerM2} kWh/m²/an ÷ ${occupants} occupants = ${round2(annualKwh)} kWh/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Climatisation
  // ---------------------------------------------------------------------------

  private computeAC(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;

    const acUsage = getSingleAnswer(
      questionByDataType.get('housing_ac_usage'),
      answers,
    );
    if (!acUsage || acUsage === 'non') return null;

    const emission = this.toACEmission(acUsage);
    const categoryId = dataTypeToCategoryId.get('housing_ac_usage') ?? '';

    return {
      key: 'housing-ac',
      label: 'Climatisation',
      valueKgCo2ePerYear: round2(emission),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: emission,
        factorUnit: 'kgCO2e/an (ADEME Base Empreinte)',
        ademeReference: 'ADEME — Climatisation résidentielle',
        formula: `Usage "${acUsage}" → ${round2(emission)} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toSurfaceM2(band?: string): number {
    switch (band) {
      case 'moins_30':
        return 22;
      case '30_60':
        return 45;
      case '60_120':
        return 90;
      case 'plus_120':
        return 150;
      default:
        return 60;
    }
  }

  private toOccupants(band?: string): number {
    switch (band) {
      case '1':
        return 1;
      case '2':
        return 2;
      case '3_4':
        return 3.5;
      case '5_plus':
        return 5.5;
      default:
        return 2;
    }
  }

  /**
   * Consommation de chauffage par m² selon l'isolation et/ou l'année de construction (norme énergétique).
   * Si construction_era est renseigné (hors "inconnu"), il prime pour refléter la réglementation thermique.
   * Source : ADEME — Chiffres clés Logement 2024.
   */
  private toAnnualKwhPerM2(
    insulationBand?: string,
    constructionEra?: string,
  ): number {
    if (constructionEra && constructionEra !== 'inconnu') {
      switch (constructionEra) {
        case 'avant_1975':
          return 280;
        case '1975_2012':
          return 150;
        case 'apres_2012':
          return 50;
        default:
          break;
      }
    }
    switch (insulationBand) {
      case 'bien_isole':
        return 50;
      case 'peu_isole':
        return 280;
      case 'standard':
      default:
        return 150;
    }
  }

  /**
   * Émission annuelle climatisation (électricité, ADEME).
   * Quelques jours/an → faible ; tout l'été → impact significatif.
   */
  private toACEmission(usage: string): number {
    switch (usage) {
      case 'non':
        return 0;
      case 'oui_peu':
        return 35;
      case 'oui_beaucoup':
        return 120;
      default:
        return 0;
    }
  }

  private getHeatingKeywords(type: string): string[] {
    const map: Record<string, string[]> = {
      gaz: ['gaz naturel réseau', 'gaz naturel', 'gaz réseau'],
      electricite: [
        'électricité réseau',
        'mix électrique réseau de France',
        'électricité France',
      ],
      pac: ['pompe à chaleur', 'PAC électricité', 'électricité réseau'],
      fioul: ['fioul domestique', 'fioul', 'fuel domestique'],
      bois: ['bois granulés', 'bois bûche', 'biomasse bois'],
      reseau_chaleur: ['réseau de chaleur urbain', 'réseau de chaleur'],
    };
    return map[type] ?? [type];
  }

  /** kgCO2e/kWh d'énergie finale — source ADEME Base Carbone 2024 */
  private getHeatingFallback(type: string): number {
    const map: Record<string, number> = {
      gaz: 0.227,
      electricite: 0.052,
      pac: 0.047,
      fioul: 0.324,
      bois: 0.03,
      reseau_chaleur: 0.075,
    };
    return map[type] ?? 0.15;
  }
}
