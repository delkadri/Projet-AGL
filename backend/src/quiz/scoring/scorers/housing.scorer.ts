import { Injectable, Logger } from '@nestjs/common';
import { AdemeBaseCarboneService } from '../../ademe-base-carbone.service';
import {
  BreakdownItem,
  ScorerContext,
  getSingleAnswer,
  round2,
} from '../scoring.types';

/** kg CO₂e / kWh — mix réseau France (aligné chauffage électrique / Base Carbone). */
const ELEC_GRID_KG_PER_KWH = 0.052;

@Injectable()
export class HousingScorer {
  private readonly logger = new Logger(HousingScorer.name);

  constructor(private readonly ademe: AdemeBaseCarboneService) {}

  async compute(ctx: ScorerContext): Promise<BreakdownItem[]> {
    const heating = await this.computeHeating(ctx);
    const hotWater = heating ? this.computeHotWater(ctx, heating) : null;
    const ac = this.computeAC(ctx);
    const otherElectricity = this.computeOtherElectricity(ctx);

    return [heating, hotWater, ac, otherElectricity].filter(
      (item): item is BreakdownItem => item !== null,
    );
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
    const buildingType = getSingleAnswer(
      questionByDataType.get('housing_building_type'),
      answers,
    );

    if (!surfaceBand || !heatingType) return null;

    const surfaceM2 = this.toSurfaceM2(surfaceBand);
    const occupants = this.toOccupants(occupantsBand);
    const annualKwhPerM2 = this.toAnnualKwhPerM2(
      insulationBand,
      constructionEra,
    );
    const buildingCoeff = this.toBuildingHeatingCoeff(buildingType);
    const annualKwh =
      ((surfaceM2 * annualKwhPerM2) / occupants) * buildingCoeff;

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
        formula: `${surfaceM2} m² × ${annualKwhPerM2} kWh/m²/an ÷ ${occupants} occ. × coeff bâtiment ${buildingCoeff} = ${round2(annualKwh)} kWh/an × ${factor} ${factorUnit} = ${emission} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Eau chaude sanitaire
  // ---------------------------------------------------------------------------

  /**
   * Uniquement si la question `housing_hot_water` est renseignée (rétrocompatibilité
   * avec les anciens quiz sans ce poste).
   */
  private computeHotWater(
    ctx: ScorerContext,
    heating: BreakdownItem,
  ): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;
    const q = questionByDataType.get('housing_hot_water');
    if (!q || answers[q.id] === undefined || answers[q.id] === null) {
      return null;
    }

    const mode = getSingleAnswer(q, answers);
    if (!mode) return null;

    const occupantsBand = getSingleAnswer(
      questionByDataType.get('housing_occupants'),
      answers,
    );
    const heatingType = getSingleAnswer(
      questionByDataType.get('heating_type'),
      answers,
    );
    const occupants = this.toOccupants(occupantsBand);
    const heatingKg = heating.valueKgCo2ePerYear;

    const kg = this.toHotWaterKg(mode, heatingType ?? '', heatingKg, occupants);
    if (kg <= 0) return null;

    const categoryId = dataTypeToCategoryId.get('housing_hot_water') ?? '';

    return {
      key: 'housing-hot-water',
      label: 'Eau chaude sanitaire',
      valueKgCo2ePerYear: round2(kg),
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: round2(kg),
        factorUnit: 'kgCO2e/an (estimation bilan logement)',
        ademeReference: 'Ordres de grandeur ADEME / usages résidentiels',
        formula: `mode="${mode}", chauffage=${heatingType ?? '?'} → ${round2(kg)} kgCO2e/an`,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Électricité spécifique (hors chauffage / ECS déjà comptés ailleurs)
  // ---------------------------------------------------------------------------

  /**
   * Uniquement si `housing_other_electricity` est présent (nouveau quiz).
   */
  private computeOtherElectricity(ctx: ScorerContext): BreakdownItem | null {
    const { answers, questionByDataType, dataTypeToCategoryId } = ctx;
    const q = questionByDataType.get('housing_other_electricity');
    if (!q || answers[q.id] === undefined || answers[q.id] === null) {
      return null;
    }

    const band = getSingleAnswer(q, answers);
    if (!band) return null;

    const kwhHousehold =
      band === 'sobre' ? 1100 : band === 'eleve' ? 3100 : 1900;
    const emission = round2(kwhHousehold * ELEC_GRID_KG_PER_KWH);
    const categoryId =
      dataTypeToCategoryId.get('housing_other_electricity') ?? '';

    return {
      key: 'housing-other-electricity',
      label: 'Électricité (froid, lumière, cuisine, multimédia…)',
      valueKgCo2ePerYear: emission,
      categoryId,
      debug: {
        factorSource: 'ademe-empreinte',
        factorValue: ELEC_GRID_KG_PER_KWH,
        factorUnit: 'kgCO2e/kWh (mix France)',
        ademeReference: 'Consommation spécifique résidentielle indicative',
        formula: `${kwhHousehold} kWh/an × ${ELEC_GRID_KG_PER_KWH} kgCO2e/kWh = ${emission} kgCO2e/an`,
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

  /** Coefficient sur le besoin chauffage annuel (déperditions) selon le type de bâtiment. */
  private toBuildingHeatingCoeff(buildingType?: string): number {
    switch (buildingType) {
      case 'appartement':
        return 0.88;
      case 'maison_mitoyenne':
        return 1.0;
      case 'maison_isolee':
        return 1.1;
      default:
        return 1.0;
    }
  }

  private toHotWaterKg(
    mode: string,
    heatingType: string,
    heatingKg: number,
    occupants: number,
  ): number {
    switch (mode) {
      case 'meme_que_chauffage':
        return this.hotWaterSameAsHeating(heatingType, heatingKg, occupants);
      case 'ballon_electrique':
        return occupants * 920 * ELEC_GRID_KG_PER_KWH;
      case 'pac_eau_chaude':
        return round2(occupants * 240 * ELEC_GRID_KG_PER_KWH);
      case 'solaire':
        return 22;
      case 'ne_sais_pas':
        return occupants * 38;
      default:
        return occupants * 35;
    }
  }

  private hotWaterSameAsHeating(
    heatingType: string,
    heatingKg: number,
    occupants: number,
  ): number {
    switch (heatingType) {
      case 'gaz':
        return round2(heatingKg * 0.24);
      case 'fioul':
        return round2(heatingKg * 0.22);
      case 'electricite':
        return round2(
          Math.min(420, Math.max(95, heatingKg * 0.1 + occupants * 35)),
        );
      case 'pac':
        return round2(heatingKg * 0.07 + occupants * 28);
      case 'bois':
        return round2(occupants * 58);
      case 'reseau_chaleur':
        return round2(heatingKg * 0.17);
      default:
        return round2(occupants * 40);
    }
  }

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
