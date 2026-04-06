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
     * @returns any
     * @throws ApiError
     */
    public static quizControllerCalculateScore({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: CalculateQuizScoreDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/quiz/{id}/score',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
