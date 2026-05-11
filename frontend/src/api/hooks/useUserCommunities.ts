import { useQuery } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import type { UserCommunityMembershipDto } from '@/types/community'

export const USER_COMMUNITIES_QUERY_KEY = ['communities', 'mine'] as const

export function useUserCommunities() {
  return useQuery<UserCommunityMembershipDto[]>({
    queryKey: USER_COMMUNITIES_QUERY_KEY,
    queryFn: () =>
      GroupsService.groupControllerGetMyGroups() as Promise<UserCommunityMembershipDto[]>,
  })
}
