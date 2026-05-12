import { useMutation } from '@tanstack/react-query'

import { GroupsService } from '@/api/client'

export function useCompleteGroupChallenge() {
  return useMutation({
    mutationFn: ({ groupId }: { groupId: string }) =>
      GroupsService.groupControllerCompleteChallenge({ id: groupId }),
  })
}
