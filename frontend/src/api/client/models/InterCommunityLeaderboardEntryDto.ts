/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LeaderboardCommunityDto } from './LeaderboardCommunityDto';
import type { LeaderboardWinStreakDto } from './LeaderboardWinStreakDto';
export type InterCommunityLeaderboardEntryDto = {
    rank: number;
    community: LeaderboardCommunityDto;
    average_carbon_tco2e_per_year: number;
    win_streak: LeaderboardWinStreakDto;
};

