/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParcoursDto } from './ParcoursDto';
export type UserProfileResponseDto = {
    id: string;
    email: string;
    firstName?: Record<string, any> | null;
    lastName?: Record<string, any> | null;
    feuilles: number;
    niveau: number;
    onboardingCompleted: boolean;
    /**
     * Au moins un bilan carbone enregistré en base (ex. quiz d’onboarding soumis), indépendamment du choix de parcours.
     */
    hasOnboardingBilan: boolean;
    parcours?: ParcoursDto | null;
    /**
     * Horodatage ISO de la dernière complétion du défi Accueil (limite une fois par jour UTC).
     */
    lastSimpleChallengeCompletedAt?: string | null;
};

