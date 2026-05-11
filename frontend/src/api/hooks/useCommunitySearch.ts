import { useQuery } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import type { CommunitySearchHitDto } from '@/data/mockCommunityDirectory'

export const COMMUNITY_SEARCH_QUERY_KEY_PREFIX = ['communities', 'search'] as const

export function useCommunitySearch(debouncedQuery: string) {
  const q = debouncedQuery.trim()

  return useQuery<CommunitySearchHitDto[]>({
    queryKey: [...COMMUNITY_SEARCH_QUERY_KEY_PREFIX, q],
    queryFn: () =>
      GroupsService.groupControllerSearchGroups({ name: q }) as Promise<CommunitySearchHitDto[]>,
    enabled: q.length >= 2,
  })
}
