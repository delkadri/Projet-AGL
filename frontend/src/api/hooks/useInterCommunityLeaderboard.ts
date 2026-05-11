import { useQuery } from '@tanstack/react-query'

import { MOCK_INTER_COMMUNITY_LEADERBOARD } from '@/data/mockCommunities'
import type { InterCommunityLeaderboardEntryDto } from '@/types/community'

const INTER_COMMUNITY_LEADERBOARD_QUERY_KEY = ['communities', 'leaderboard', 'inter'] as const

const MOCK_LATENCY_MS = 500

/**
 * Simule GET /communities/leaderboard (classement inter-communautés) jusqu’à l’endpoint réel.
 */
export function useInterCommunityLeaderboard() {
  return useQuery<InterCommunityLeaderboardEntryDto[]>({
    queryKey: INTER_COMMUNITY_LEADERBOARD_QUERY_KEY,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS))
      return MOCK_INTER_COMMUNITY_LEADERBOARD
    },
  })
}
