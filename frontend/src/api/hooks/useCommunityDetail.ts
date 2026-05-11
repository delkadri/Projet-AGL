import { useQuery } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import type { CommunityDetailDto } from '@/types/community'

export function communityDetailQueryKey(communityId: string) {
  return ['communities', 'detail', communityId] as const
}

export function useCommunityDetail(communityId: string) {
  return useQuery<CommunityDetailDto | null>({
    queryKey: communityDetailQueryKey(communityId),
    queryFn: () =>
      GroupsService.groupControllerGetGroupDetails({ id: communityId }) as Promise<CommunityDetailDto | null>,
    enabled: Boolean(communityId),
  })
}
