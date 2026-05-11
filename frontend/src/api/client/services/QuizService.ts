/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CalculateQuizScoreDto } from '../models/CalculateQuizScoreDto';
import type { PreviewQuizScoreDto } from '../models/PreviewQuizScoreDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuizService {
    /**
     * Référence nationale (empreinte moyenne par habitant et par catégorie)
     * @returns any
     * @throws ApiError
     */
    public static quizControllerGetNationalFootprintReference({
        quizId,
    }: {
        quizId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/quiz/national-footprint-reference/{quizId}',
            path: {
                'quizId': quizId,
            },
        });
    }
    /**
     * Dernier bilan carbone enregistré (recalcul à la volée)
     * @returns any
     * @throws ApiError
     */
    public static quizControllerGetOnboardingResult(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/quiz/onboarding-result',
        });
    }
    /**
     * Détail d’un bilan carbone précis (par score_history.id)
     * @returns any
     * @throws ApiError
     */
    public static quizControllerGetScoreHistoryDetail({
        id,
    }: {
        /**
         * Identifiant score_history.
         */
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/quiz/score-history/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static quizControllerGetQuiz({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/quiz/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any
     * @throws ApiError
     */
    public static quizControllerPreviewScore({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: PreviewQuizScoreDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/quiz/{id}/preview',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns void
     * @throws ApiError
     */
    public static quizControllerCalculateScore({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CalculateQuizScoreDto,
    }): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/quiz/{id}/score',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Un score est déjà enregistré pour ce mois civil (UTC) ; un seul bilan par mois et par année.`,
            },
        });
    }
}
