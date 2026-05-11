import { useQuery } from '@tanstack/react-query'

import { QuizService } from '@/api/client'
import { useCurrentUserQuery } from '@/api/hooks/useAuth'

export const ONBOARDING_QUIZ_RESULT_QUERY_KEY = ['quiz', 'onboarding-result'] as const

/** Réponse GET /quiz/onboarding-result (dernier bilan en base + métadonnées d’enregistrement). */
export type OnboardingQuizResultPayload = {
  savedAt: string
  scoreHistoryId?: string
  quizId: string
  quizName: string
  score: {
    totalKgCo2ePerYear: number
    climateLevel: string
    publicServicesFixedKg?: number
  }
  categories: unknown[]
  onboardingBilan?: unknown
}

export function useOnboardingQuizResult(enabled = true) {
  const { data: user } = useCurrentUserQuery()

  return useQuery({
    queryKey: ONBOARDING_QUIZ_RESULT_QUERY_KEY,
    queryFn: async () => {
      const r =
        (await QuizService.quizControllerGetOnboardingResult()) as OnboardingQuizResultPayload
      return r
    },
    enabled: !!user && !!user.hasOnboardingBilan && enabled,
  })
}
