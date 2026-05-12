import { useMutation, useQueryClient } from '@tanstack/react-query'

import { UsersService } from '@/api/client'

import { AUTH_ME_QUERY_KEY } from './useAuth'

export function useCompleteSimpleDailyChallenge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => UsersService.userControllerCompleteSimpleDailyChallenge(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
    },
  })
}
