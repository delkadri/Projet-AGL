/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ScoreHistoryResponseDto } from '../models/ScoreHistoryResponseDto';
import type { UpdateParcoursDto } from '../models/UpdateParcoursDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Mettre à jour le parcours de l'utilisateur
     * @returns any Le parcours a été mis à jour.
     * @throws ApiError
     */
    public static userControllerUpdateParcours({
        requestBody,
    }: {
        requestBody: UpdateParcoursDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/me/parcours',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Marquer l'onboarding comme complété
     * @returns any L'onboarding a été marqué comme terminé.
     * @throws ApiError
     */
    public static userControllerCompleteOnboarding(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/me/onboarding/complete',
        });
    }
    /**
     * Récupérer l'historique des scores carbone de l'utilisateur
     * @returns ScoreHistoryResponseDto Historique des scores récupéré avec succès
     * @throws ApiError
     */
    public static userControllerGetScoreHistory(): CancelablePromise<Array<ScoreHistoryResponseDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/me/scores',
        });
    }
}
