/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MonthlyQuizResponseDto } from './MonthlyQuizResponseDto';
export type MonthlyQuizCurrentDto = {
    /**
     * Sous-quiz du mois (4 catégories) si une mise à jour est possible ce mois-ci, sinon null.
     */
    quiz: MonthlyQuizResponseDto | null;
    /**
     * Date ISO du dernier score enregistré (score_history.created_at).
     */
    lastScoreHistoryAt: string | null;
    /**
     * Prochaine ouverture prévue du quiz mensuel (users.next_monthly_quiz_at), renseignée après une soumission.
     */
    nextMonthlyQuizAt: string | null;
    /**
     * none = aucun historique, recent = dernier score ≤ 21 jours, stale = dernier score > 21 jours.
     */
    dataFreshness: MonthlyQuizCurrentDto.dataFreshness;
    /**
     * Réponses du dernier enregistrement (score_history) pour préremplir l’UI et résoudre les showIf ; le POST submit n’envoie que les questions mises à jour.
     */
    baselineAnswers: Record<string, any> | null;
};
export namespace MonthlyQuizCurrentDto {
    /**
     * none = aucun historique, recent = dernier score ≤ 21 jours, stale = dernier score > 21 jours.
     */
    export enum dataFreshness {
        NONE = 'none',
        RECENT = 'recent',
        STALE = 'stale',
    }
}

