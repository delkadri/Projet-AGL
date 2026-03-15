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

@Injectable()
export class AdemeBaseCarboneService {
  private readonly logger = new Logger(AdemeBaseCarboneService.name);
  private readonly apiBaseUrl: string;
  private readonly datasetId: string;
  private readonly apiKey?: string;
  private readonly factorField: string;
  private readonly unitField: string;
  private readonly cache = new Map<string, FactorLookupResult>();

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

  async findFactorByKeywords(keywords: string[]): Promise<FactorLookupResult | null> {
    const cacheKey = keywords.join('|').toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    for (const keyword of keywords) {
      const factor = await this.searchSingleKeyword(keyword);
      if (factor) {
        this.cache.set(cacheKey, factor);
        return factor;
      }
    }

    return null;
  }

  private async searchSingleKeyword(keyword: string): Promise<FactorLookupResult | null> {
    const url = new URL(`${this.apiBaseUrl}/${this.datasetId}/lines`);
    url.searchParams.set('q', keyword);
    url.searchParams.set('size', '1');

    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

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
      const first = payload.results?.[0];
      if (!first) {
        return null;
      }

      const rawFactor = first[this.factorField] ?? first['Total_poste_non_décomposé'];
      const factor = this.parseFactor(rawFactor);
      if (factor === null) {
        return null;
      }

      const result: FactorLookupResult = {
        factor,
        source: {
          keyword,
          baseName: this.toOptionalString(first['Nom_base_français']),
          attributeName: this.toOptionalString(first['Nom_attribut_français']),
          unit:
            this.toOptionalString(first[this.unitField]) ??
            this.toOptionalString(first['Unité_français']),
          datasetId: this.datasetId,
        },
      };

      return result;
    } catch (error) {
      this.logger.warn(
        `ADEME lookup error for keyword="${keyword}": ${(error as Error).message}`,
      );
      return null;
    }
  }

  private parseFactor(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.replace(',', '.').replace(/\s/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    return value;
  }
}
