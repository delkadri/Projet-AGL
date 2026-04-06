import { useQuery } from '@tanstack/react-query'

import { MOCK_USER_COMMUNITIES } from '@/data/mockCommunities'
import { getSessionJoinedMemberships } from '@/data/mockCommunitySession'
import type { UserCommunityMembershipDto } from '@/types/community'

export const USER_COMMUNITIES_QUERY_KEY = ['communities', 'mine'] as const

const MOCK_LATENCY_MS = 450

function mergeMemberships(base: UserCommunityMembershipDto[]): UserCommunityMembershipDto[] {
  const seen = new Set(base.map((m) => m.community.id))
  const extra = getSessionJoinedMemberships().filter((m) => {
    if (seen.has(m.community.id)) return false
    seen.add(m.community.id)
    return true
  })
  return [...base, ...extra]
}

/**
 * Simule un appel backend (GET communautés de l’utilisateur) jusqu’à l’existence de l’endpoint réel.
 */
export function useUserCommunities() {
  return useQuery<UserCommunityMembershipDto[]>({
    queryKey: USER_COMMUNITIES_QUERY_KEY,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS))
      return mergeMemberships(MOCK_USER_COMMUNITIES)
    },
  })
}
