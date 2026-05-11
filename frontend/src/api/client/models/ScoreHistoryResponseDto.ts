/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScoreHistoryCategoryDto } from './ScoreHistoryCategoryDto';
export type ScoreHistoryResponseDto = {
    /**
     * ID de l'entrée d'historique
     */
    id: string;
    /**
     * Score carbone obtenu
     */
    score: number;
    /**
     * Date de l'enregistrement
     */
    created_at: string;
    /**
     * Totaux par catégorie au moment de l’enregistrement (peut être null pour les anciennes entrées).
     */
    categories_scores?: Array<ScoreHistoryCategoryDto> | null;
};

