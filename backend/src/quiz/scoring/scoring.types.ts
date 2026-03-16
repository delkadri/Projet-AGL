// ---------------------------------------------------------------------------
// Quiz structure types
// ---------------------------------------------------------------------------

/** Condition to show a question only when another answer matches (used by frontend for conditional display). */
export type QuestionShowIf = {
  questionId: string;
  value?: string | number | string[];
  operator?: 'gt' | 'gte' | 'neq';
};

export type QuizQuestion = {
  id: string;
  type: 'single' | 'multiple' | 'number';
  title: string;
  carbonMeta?: {
    poste?: string;
    dataType?: string;
  };
  /** Optional: show this question only when the referenced answer satisfies the condition. */
  showIf?: QuestionShowIf;
};

export type QuizCategory = {
  id: string;
  name: string;
  questions: QuizQuestion[];
};

export type QuizPayload = {
  id: string;
  name: string;
  categories: QuizCategory[];
};

// ---------------------------------------------------------------------------
// Breakdown / bilan types
// ---------------------------------------------------------------------------

/**
 * Source des données utilisées pour un facteur d'émission :
 * - `ademe-api`        : facteur issu de l'API ADEME Base Carbone (temps réel)
 * - `ademe-empreinte`  : valeur issue de l'étude ADEME Base Empreinte (publiée, non disponible via API)
 * - `estimate`         : valeur estimée non officielle (éviter)
 */
export type FactorSource = 'ademe-api' | 'ademe-empreinte' | 'estimate';

/** Informations de debug par poste de calcul. */
export type DebugInfo = {
  factorSource: FactorSource;
  factorValue: number;
  factorUnit: string;
  ademeReference?: string;
  formula: string;
};

/** Poste calculé du bilan (avec categoryId et debug pour le regroupement). */
export type BreakdownItem = {
  key: string;
  label: string;
  valueKgCo2ePerYear: number;
  categoryId: string;
  debug: DebugInfo;
};

/** Catégorie du bilan renvoyée au front (postes groupés). */
export type CategoryBilan = {
  id: string;
  name: string;
  items: Array<{
    key: string;
    label: string;
    valueKgCo2ePerYear: number;
    debug: DebugInfo;
  }>;
};

// ---------------------------------------------------------------------------
// Scorer context
// ---------------------------------------------------------------------------

/** Contexte passé à chaque scorer lors du calcul. */
export type ScorerContext = {
  answers: Record<string, unknown>;
  questionByDataType: Map<string, QuizQuestion>;
  dataTypeToCategoryId: Map<string, string>;
};

// ---------------------------------------------------------------------------
// Answer parsing helpers
// ---------------------------------------------------------------------------

export function getSingleAnswer(
  question: QuizQuestion | undefined,
  answers: Record<string, unknown>,
): string | undefined {
  if (!question) return undefined;
  const value = answers[question.id];
  if (value === undefined || value === null) return undefined;
  // Tolérance : convertit les nombres en string pour éviter les erreurs de type
  if (typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;
  return value;
}

export function getNumberAnswer(
  question: QuizQuestion | undefined,
  answers: Record<string, unknown>,
): number | undefined {
  if (!question) return undefined;
  const value = answers[question.id];
  if (value === undefined || value === null) return undefined;
  // Tolérance : convertit les strings numériques
  const num = typeof value === 'string' ? parseFloat(value) : (value as number);
  if (typeof num !== 'number' || !Number.isFinite(num) || num < 0) return undefined;
  return num;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
