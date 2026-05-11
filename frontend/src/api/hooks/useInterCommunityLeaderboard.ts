import { useQuery } from '@tanstack/react-query'

import { OpenAPI } from '@/api/client'
import type { InterCommunityLeaderboardEntryDto } from '@/types/community'

const INTER_COMMUNITY_LEADERBOARD_QUERY_KEY = ['communities', 'leaderboard', 'inter'] as const

export function useInterCommunityLeaderboard() {
  return useQuery<InterCommunityLeaderboardEntryDto[]>({
    queryKey: INTER_COMMUNITY_LEADERBOARD_QUERY_KEY,
    queryFn: async () => {
      const token =
        typeof OpenAPI.TOKEN === 'function'
          ? await OpenAPI.TOKEN({} as Parameters<typeof OpenAPI.TOKEN>[0])
          : OpenAPI.TOKEN

      const res = await fetch(`${OpenAPI.BASE}/communities/leaderboard`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!res.ok) throw new Error('Leaderboard fetch failed')
      return res.json() as Promise<InterCommunityLeaderboardEntryDto[]>
    },
  })
}
