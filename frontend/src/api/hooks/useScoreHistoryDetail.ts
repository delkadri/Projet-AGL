import { useQuery } from '@tanstack/react-query'

import { QuizService } from '@/api/client'
import { useCurrentUserQuery } from '@/api/hooks/useAuth'
import type { OnboardingQuizResultPayload } from '@/api/hooks/useOnboardingQuizResult'

export const SCORE_HISTORY_DETAIL_QUERY_KEY = ['score_history_detail'] as const

/**
 * Détail d’un bilan carbone enregistré (cliquable depuis l’historique).
 * Réponse identique à celle de `GET /api/quiz/onboarding-result` mais pour une entrée `score_history` précise.
 */
export function useScoreHistoryDetail(scoreHistoryId: string | undefined) {
  const { data: user } = useCurrentUserQuery()

  return useQuery({
    queryKey: [...SCORE_HISTORY_DETAIL_QUERY_KEY, scoreHistoryId],
    queryFn: async () => {
      const r = (await QuizService.quizControllerGetScoreHistoryDetail({
        id: scoreHistoryId as string,
      })) as OnboardingQuizResultPayload
      return r
    },
    enabled: !!user && !!scoreHistoryId,
  })
}
