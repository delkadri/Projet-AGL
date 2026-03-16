import { useQuery } from '@tanstack/react-query'
import { UsersService } from '../client/services/UsersService'
import { useCurrentUserQuery } from './useAuth'

export const SCORE_HISTORY_QUERY_KEY = ['score_history'] as const

export function useScoreHistory() {
  const { data: user } = useCurrentUserQuery()

  return useQuery({
    queryKey: SCORE_HISTORY_QUERY_KEY,
    queryFn: () => UsersService.userControllerGetScoreHistory(),
    enabled: !!user,
  })
}
