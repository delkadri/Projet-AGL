import { useMutation, useQueryClient } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import { COMMUNITY_SEARCH_QUERY_KEY_PREFIX } from '@/api/hooks/useCommunitySearch'
import { USER_COMMUNITIES_QUERY_KEY } from '@/api/hooks/useUserCommunities'

export const JOIN_ERROR_INVALID_CODE = 'JOIN_INVALID_INVITE_CODE'
export const JOIN_ERROR_NOT_FOUND = 'JOIN_COMMUNITY_NOT_FOUND'

export function useJoinCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      communityId,
      inviteCode,
    }: {
      communityId: string
      inviteCode?: string
    }) => {
      if (inviteCode) {
        return GroupsService.groupControllerJoinGroupByCode({ code: inviteCode })
      }
      return GroupsService.groupControllerJoinGroupById({ id: communityId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_COMMUNITIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: COMMUNITY_SEARCH_QUERY_KEY_PREFIX })
    },
  })
}
