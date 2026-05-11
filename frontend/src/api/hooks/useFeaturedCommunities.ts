import { useQuery } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import type { CommunitySearchHitDto } from '@/data/mockCommunityDirectory'

export const FEATURED_COMMUNITIES_QUERY_KEY = ['communities', 'featured'] as const

export function useFeaturedCommunities() {
  return useQuery<CommunitySearchHitDto[]>({
    queryKey: FEATURED_COMMUNITIES_QUERY_KEY,
    queryFn: () =>
      GroupsService.groupControllerSearchGroups({ name: '' }) as Promise<CommunitySearchHitDto[]>,
  })
}
