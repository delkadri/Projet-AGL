import { useQuery } from '@tanstack/react-query'

import { getMockCommunityDetail } from '@/data/mockCommunityDetail'
import type { CommunityDetailDto } from '@/types/community'

const MOCK_LATENCY_MS = 400

export function communityDetailQueryKey(communityId: string) {
  return ['communities', 'detail', communityId] as const
}

/**
 * Simule GET /communities/:id jusqu’à l’existence de l’endpoint réel.
 * Retourne `null` si la communauté n’existe pas dans les mocks.
 */
export function useCommunityDetail(communityId: string) {
  return useQuery<CommunityDetailDto | null>({
    queryKey: communityDetailQueryKey(communityId),
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS))
      return getMockCommunityDetail(communityId) ?? null
    },
    enabled: Boolean(communityId),
  })
}
