/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type LeaderboardWinStreakDto = {
    count: number;
    status: LeaderboardWinStreakDto.status;
};
export namespace LeaderboardWinStreakDto {
    export enum status {
        ACTIVE = 'active',
        AT_RISK = 'at_risk',
        BROKEN = 'broken',
    }
}

