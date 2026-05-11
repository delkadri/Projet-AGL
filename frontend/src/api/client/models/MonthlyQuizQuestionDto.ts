/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MonthlyQuizOptionDto } from './MonthlyQuizOptionDto';
export type MonthlyQuizQuestionDto = {
    id: string;
    type: string;
    title: string;
    description?: string;
    options?: Array<MonthlyQuizOptionDto>;
    min?: number;
    max?: number;
    showIf?: Record<string, any>;
    carbonMeta?: Record<string, any>;
};

