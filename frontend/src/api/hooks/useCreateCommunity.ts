import { useMutation, useQueryClient } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'
import type { CreateCommunityPayload, UserCommunityMembershipDto } from '@/types/community'

const USER_COMMUNITIES_QUERY_KEY = ['communities', 'mine'] as const

export function useCreateCommunity() {
  const queryClient = useQueryClient()

  return useMutation<UserCommunityMembershipDto, Error, CreateCommunityPayload>({
    mutationFn: ({ name, description, is_private }) =>
      GroupsService.groupControllerCreateGroup({
        requestBody: { name, description, is_public: !is_private },
      }) as Promise<UserCommunityMembershipDto>,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: USER_COMMUNITIES_QUERY_KEY })
    },
  })
}
