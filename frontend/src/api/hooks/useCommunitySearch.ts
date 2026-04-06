import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_COMMUNITIES } from '@/data/mockCommunities'
import {
  searchMockCommunities,
  type CommunitySearchHitDto,
} from '@/data/mockCommunityDirectory'
import { getSessionJoinedMemberships } from '@/data/mockCommunitySession'

const MOCK_SEARCH_MS = 380

export const COMMUNITY_SEARCH_QUERY_KEY_PREFIX = ['communities', 'search'] as const

function currentMemberIdSet(): Set<string> {
  const ids = new Set<string>()
  for (const m of MOCK_USER_COMMUNITIES) ids.add(m.community.id)
  for (const m of getSessionJoinedMemberships()) ids.add(m.community.id)
  return ids
}

/**
 * Simule GET /communities?q=… (recherche d’annuaire).
 */
export function useCommunitySearch(debouncedQuery: string) {
  const q = debouncedQuery.trim()

  return useQuery<CommunitySearchHitDto[]>({
    queryKey: [...COMMUNITY_SEARCH_QUERY_KEY_PREFIX, q],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, MOCK_SEARCH_MS))
      return searchMockCommunities(q, currentMemberIdSet())
    },
    enabled: q.length >= 2,
  })
}
