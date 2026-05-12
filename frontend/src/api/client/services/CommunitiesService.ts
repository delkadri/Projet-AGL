/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InterCommunityLeaderboardEntryDto } from '../models/InterCommunityLeaderboardEntryDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CommunitiesService {
    /**
     * Classement inter-communautés
     * @returns InterCommunityLeaderboardEntryDto
     * @throws ApiError
     */
    public static communityControllerGetLeaderboard(): CancelablePromise<Array<InterCommunityLeaderboardEntryDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/communities/leaderboard',
        });
    }
    /**
     * Timestamp de la prochaine remise à zéro des classements
     * @returns any
     * @throws ApiError
     */
    public static communityControllerGetNextRankingReset(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/communities/ranking/next-reset',
        });
    }
}
