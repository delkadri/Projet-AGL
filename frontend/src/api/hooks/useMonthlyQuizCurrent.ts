import { useQuery } from '@tanstack/react-query'

import { MonthlyQuizService } from '@/api/client/services/MonthlyQuizService'
import { useCurrentUserQuery } from '@/api/hooks/useAuth'

export const MONTHLY_QUIZ_CURRENT_QUERY_KEY = ['monthly-quiz', 'current'] as const

export function useMonthlyQuizCurrent(enabled = true) {
  const { data: user } = useCurrentUserQuery()

  return useQuery({
    queryKey: MONTHLY_QUIZ_CURRENT_QUERY_KEY,
    queryFn: () => MonthlyQuizService.monthlyQuizControllerGetCurrentMonthlyQuiz(),
    enabled: Boolean(user?.onboardingCompleted) && enabled,
  })
}
