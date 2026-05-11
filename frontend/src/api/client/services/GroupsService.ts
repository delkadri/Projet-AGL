/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateGroupDto } from '../models/CreateGroupDto';
import type { SendMessageDto } from '../models/SendMessageDto';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GroupsService {
    /**
     * Liste des groupes de l'utilisateur connecté
     * @returns any Groupes retournés
     * @throws ApiError
     */
    public static groupControllerGetMyGroups(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/me',
        });
    }
    /**
     * Rechercher un groupe public par nom
     * @returns any Groupes correspondants
     * @throws ApiError
     */
    public static groupControllerSearchGroups({
        name,
    }: {
        name: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/search',
            query: {
                'name': name,
            },
        });
    }
    /**
     * Rejoindre un groupe privé via code d'invitation
     * @returns any Groupe rejoint
     * @throws ApiError
     */
    public static groupControllerJoinGroupByCode({
        code,
    }: {
        code: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/join/{code}',
            path: {
                'code': code,
            },
            errors: {
                404: `Code invalide`,
                409: `Déjà membre`,
            },
        });
    }
    /**
     * Créer un groupe (niveau ≥ 3 requis)
     * @returns any Groupe créé
     * @throws ApiError
     */
    public static groupControllerCreateGroup({
        requestBody,
    }: {
        requestBody: CreateGroupDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Niveau insuffisant`,
            },
        });
    }
    /**
     * Détails du groupe (membres, win streak, défi en cours)
     * @returns any Détails du groupe
     * @throws ApiError
     */
    public static groupControllerGetGroupDetails({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Groupe non trouvé`,
            },
        });
    }
    /**
     * Dissoudre le groupe (admin uniquement)
     * @returns any Groupe supprimé
     * @throws ApiError
     */
    public static groupControllerDeleteGroup({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{id}',
            path: {
                'id': id,
            },
            errors: {
                403: `Accès refusé`,
                404: `Groupe non trouvé`,
            },
        });
    }
    /**
     * Rejoindre un groupe public
     * @returns any Groupe rejoint
     * @throws ApiError
     */
    public static groupControllerJoinGroupById({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{id}/join',
            path: {
                'id': id,
            },
            errors: {
                403: `Groupe privé`,
                404: `Groupe non trouvé`,
                409: `Déjà membre`,
            },
        });
    }
    /**
     * Exclure un membre (admin uniquement)
     * @returns any Membre exclu
     * @throws ApiError
     */
    public static groupControllerRemoveMember({
        id,
        userId,
    }: {
        id: string,
        userId: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/groups/{id}/members/{userId}',
            path: {
                'id': id,
                'userId': userId,
            },
            errors: {
                403: `Accès refusé`,
                404: `Groupe non trouvé`,
            },
        });
    }
    /**
     * Défi de la semaine + barre de progression
     * @returns any
     * @throws ApiError
     */
    public static groupControllerGetGroupChallenge({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{id}/challenge',
            path: {
                'id': id,
            },
            errors: {
                404: `Aucun défi cette semaine`,
            },
        });
    }
    /**
     * Marquer le défi hebdomadaire comme complété
     * @returns any Défi complété
     * @throws ApiError
     */
    public static groupControllerCompleteChallenge({
        id,
    }: {
        id: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{id}/challenge/complete',
            path: {
                'id': id,
            },
            errors: {
                404: `Aucun défi cette semaine`,
                409: `Défi déjà complété`,
            },
        });
    }
    /**
     * Historique paginé des messages du groupe (curseur par date)
     * @returns any Messages retournés
     * @throws ApiError
     */
    public static chatControllerListMessages({
        id,
        limit = 50,
        before,
    }: {
        id: string,
        limit?: number,
        /**
         * Curseur de pagination : ISO date — renvoie les messages strictement antérieurs.
         */
        before?: string,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/groups/{id}/messages',
            path: {
                'id': id,
            },
            query: {
                'limit': limit,
                'before': before,
            },
            errors: {
                403: `Non membre du groupe`,
            },
        });
    }
    /**
     * Envoyer un message (persisté en base + broadcast Supabase Realtime)
     * @returns any Message envoyé
     * @throws ApiError
     */
    public static chatControllerSendMessage({
        id,
        requestBody,
    }: {
        id: string,
        requestBody: SendMessageDto,
    }): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/groups/{id}/messages',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Non membre du groupe`,
            },
        });
    }
}
