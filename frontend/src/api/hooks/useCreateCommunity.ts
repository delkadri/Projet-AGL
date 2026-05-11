import { useMutation, useQueryClient } from '@tanstack/react-query'

import { mockCreateCommunity } from '@/data/mockCommunities'
import type { CreateCommunityPayload, UserCommunityMembershipDto } from '@/types/community'

const USER_COMMUNITIES_QUERY_KEY = ['communities', 'mine'] as const

/**
 * Simule POST /communities jusqu’à l’endpoint réel ; met à jour le cache de la liste.
 */
export function useCreateCommunity() {
  const queryClient = useQueryClient()

  return useMutation<UserCommunityMembershipDto, Error, CreateCommunityPayload>({
    mutationFn: mockCreateCommunity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USER_COMMUNITIES_QUERY_KEY })
    },
  })
}
