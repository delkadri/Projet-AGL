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
    parcours?: ParcoursDto | null;
};

