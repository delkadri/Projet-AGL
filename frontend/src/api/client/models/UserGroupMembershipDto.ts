/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GroupSummaryDto } from './GroupSummaryDto';
export type UserGroupMembershipDto = {
    community: GroupSummaryDto;
    role: UserGroupMembershipDto.role;
    joined_at: string;
    has_pending_defi: boolean;
};
export namespace UserGroupMembershipDto {
    export enum role {
        ADMIN = 'ADMIN',
        MEMBER = 'MEMBER',
    }
}

