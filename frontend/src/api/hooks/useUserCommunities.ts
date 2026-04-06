import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_COMMUNITIES } from '@/data/mockCommunities'
import type { UserCommunityMembershipDto } from '@/types/community'

const USER_COMMUNITIES_QUERY_KEY = ['communities', 'mine'] as const

const MOCK_LATENCY_MS = 450

/**
 * Simule un appel backend (GET communautés de l’utilisateur) jusqu’à l’existence de l’endpoint réel.
 */
export function useUserCommunities() {
  return useQuery<UserCommunityMembershipDto[]>({
    queryKey: USER_COMMUNITIES_QUERY_KEY,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS))
      return MOCK_USER_COMMUNITIES
    },
  })
}
