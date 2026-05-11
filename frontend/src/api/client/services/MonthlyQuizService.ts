/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MonthlyQuizCurrentDto } from '../models/MonthlyQuizCurrentDto';
import type { SubmitMonthlyQuizDto } from '../models/SubmitMonthlyQuizDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MonthlyQuizService {
    /**
     * Écran quiz du mois : sous-quiz éventuel + métadonnées (dernier score, prochaine ouverture, fraîcheur)
     * @returns MonthlyQuizCurrentDto Enveloppe avec quiz ou null si le mois UTC courant est déjà complété.
     * @throws ApiError
     */
    public static monthlyQuizControllerGetCurrentMonthlyQuiz(): CancelablePromise<MonthlyQuizCurrentDto> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/monthly-quiz/current',
        });
    }
    /**
     * [DEV uniquement] Simule le mois suivant : score_history et verrous du mois UTC courant sont déplacés vers le mois précédent.
     * @returns any score_history du mois courant clonés en mois précédent puis supprimés ; lastMonthlyQuizAt recalculé.
     * @throws ApiError
     */
    public static monthlyQuizControllerDevSimulateNextMonth(): CancelablePromise<{
        ok?: boolean;
        scoreRowsShifted?: number;
        monthlyQuizzesUpdated?: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/monthly-quiz/dev/simulate-next-month',
            errors: {
                400: `Aucune donnée du mois courant à simuler.`,
                403: `Desactive en production (NODE_ENV=production).`,
            },
        });
    }
    /**
     * Soumet les reponses du quiz mensuel et declenche le recalcul du score
     * @returns any Score carbone recalcule et enregistre dans l'historique utilisateur.
     * @throws ApiError
     */
    public static monthlyQuizControllerSubmitMonthlyQuiz({
        id,
        requestBody,
    }: {
        /**
         * Identifiant du quiz (ex: quiz-1).
         */
        id: string,
        requestBody: SubmitMonthlyQuizDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/monthly-quiz/{id}/submit',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Quiz mensuel deja complete ce mois.`,
            },
        });
    }
}
