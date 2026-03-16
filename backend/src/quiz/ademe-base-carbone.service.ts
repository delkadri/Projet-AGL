import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type FactorLookupSource = {
  keyword: string;
  baseName?: string;
  attributeName?: string;
  unit?: string;
  datasetId: string;
};

export type FactorLookupResult = {
  factor: number;
  source: FactorLookupSource;
};

export type FindFactorOptions = {
  /**
   * Hint sur l'unité attendue (ex: '/km').
   * Les résultats ADEME dont l'unité ne contient pas ce hint sont ignorés.
   * Si aucun résultat ne correspond, on tombe en fallback sur le premier résultat sans filtre.
   */
  expectedUnitHint?: string;
  /** Valeur minimale acceptable pour le facteur (sanity check). */
  minFactor?: number;
  /** Valeur maximale acceptable pour le facteur (sanity check). */
  maxFactor?: number;
};

@Injectable()
export class AdemeBaseCarboneService {
  private readonly logger = new Logger(AdemeBaseCarboneService.name);
  private readonly apiBaseUrl: string;
  private readonly datasetId: string;
  private readonly apiKey?: string;
  private readonly factorField: string;
  private readonly unitField: string;
  private readonly cache = new Map<string, FactorLookupResult | null>();

  constructor(private readonly configService: ConfigService) {
    this.apiBaseUrl =
      this.configService.get<string>('ADEME_API_BASE_URL') ??
      'https://data.ademe.fr/data-fair/api/v1/datasets';
    this.datasetId =
      this.configService.get<string>('ADEME_BASE_CARBONE_DATASET_ID') ??
      'base-carboner';
    this.apiKey = this.configService.get<string>('ADEME_API_KEY');
    this.factorField =
      this.configService.get<string>('ADEME_FACTOR_FIELD') ??
      'Total_poste_non_décomposé';
    this.unitField =
      this.configService.get<string>('ADEME_UNIT_FIELD') ?? 'Unité_français';
  }

  async findFactorByKeywords(
    keywords: string[],
    options?: FindFactorOptions,
  ): Promise<FactorLookupResult | null> {
    const cacheKey = [
      keywords.join('|').toLowerCase(),
      options?.expectedUnitHint ?? '',
      options?.minFactor ?? '',
      options?.maxFactor ?? '',
    ].join(':');
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) ?? null;
    }

    for (const keyword of keywords) {
      const factor = await this.searchSingleKeyword(keyword, options);
      if (factor) {
        this.cache.set(cacheKey, factor);
        return factor;
      }
    }

    this.cache.set(cacheKey, null);
    return null;
  }

  private async searchSingleKeyword(
    keyword: string,
    options?: FindFactorOptions,
  ): Promise<FactorLookupResult | null> {
    const url = new URL(`${this.apiBaseUrl}/${this.datasetId}/lines`);
    url.searchParams.set('q', keyword);
    // On récupère plusieurs candidats pour pouvoir filtrer par unité
    url.searchParams.set('size', '10');

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (this.apiKey) {
        headers['x-apiKey'] = this.apiKey;
        headers.Authorization = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        this.logger.warn(
          `ADEME lookup failed for keyword="${keyword}": ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const payload = (await response.json()) as {
        results?: Array<Record<string, unknown>>;
      };
      const rows = payload.results ?? [];
      if (rows.length === 0) return null;

      // Filtrer par unité attendue si fournie.
      // Si un hint est spécifié mais qu'aucun résultat ne correspond à l'unité,
      // on retourne null (pas de fallback sur des facteurs avec mauvaise unité).
      const candidates = options?.expectedUnitHint
        ? rows.filter((row) => {
            const unit =
              this.toOptionalString(row[this.unitField]) ??
              this.toOptionalString(row['Unité_français']) ??
              '';
            return unit
              .toLowerCase()
              .includes(options.expectedUnitHint!.toLowerCase());
          })
        : rows;

      if (options?.expectedUnitHint && candidates.length === 0) {
        this.logger.debug(
          `[ADEME] Aucun résultat avec unité contenant "${options.expectedUnitHint}" pour "${keyword}" — valeur de repli utilisée`,
        );
        return null;
      }

      const rowsToTry = candidates.length > 0 ? candidates : rows;

      for (const row of rowsToTry) {
        const rawFactor =
          row[this.factorField] ?? row['Total_poste_non_décomposé'];
        const factor = this.parseFactor(rawFactor);
        if (factor === null) continue;

        // Sanity check : rejeter les facteurs hors des bornes attendues
        if (options?.minFactor !== undefined && factor < options.minFactor) {
          this.logger.warn(
            `[ADEME] Facteur ${factor} pour "${keyword}" (unité: ${this.toOptionalString(row[this.unitField]) ?? '?'}) inférieur au min ${options.minFactor} — ignoré`,
          );
          continue;
        }
        if (options?.maxFactor !== undefined && factor > options.maxFactor) {
          this.logger.warn(
            `[ADEME] Facteur ${factor} pour "${keyword}" (unité: ${this.toOptionalString(row[this.unitField]) ?? '?'}) supérieur au max ${options.maxFactor} — ignoré`,
          );
          continue;
        }

        const result: FactorLookupResult = {
          factor,
          source: {
            keyword,
            baseName: this.toOptionalString(row['Nom_base_français']),
            attributeName: this.toOptionalString(row['Nom_attribut_français']),
            unit:
              this.toOptionalString(row[this.unitField]) ??
              this.toOptionalString(row['Unité_français']),
            datasetId: this.datasetId,
          },
        };

        this.logger.debug(
          `[ADEME] Facteur retenu pour "${keyword}": ${factor} (${result.source.unit ?? '?'}) — ${result.source.baseName ?? '?'} / ${result.source.attributeName ?? '?'}`,
        );

        return result;
      }

      this.logger.warn(
        `[ADEME] Aucun facteur valide trouvé pour keyword="${keyword}"` +
          (options?.expectedUnitHint
            ? ` avec unité hint="${options.expectedUnitHint}"`
            : '') +
          (options?.minFactor !== undefined
            ? `, min=${options.minFactor}`
            : '') +
          (options?.maxFactor !== undefined
            ? `, max=${options.maxFactor}`
            : ''),
      );
      return null;
    } catch (error) {
      this.logger.warn(
        `[ADEME] Erreur lors de la recherche pour keyword="${keyword}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  private parseFactor(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value !== 'string') return null;
    const normalized = value.replace(',', '.').replace(/\s/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
