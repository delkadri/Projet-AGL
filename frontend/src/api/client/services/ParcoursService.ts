/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParcoursDto } from '../models/ParcoursDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ParcoursService {
    /**
     * Récupérer la liste des parcours disponibles
     * @returns ParcoursDto Liste des parcours
     * @throws ApiError
     */
    public static parcoursControllerGetAllParcours(): CancelablePromise<Array<ParcoursDto>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/parcours',
        });
    }
}
