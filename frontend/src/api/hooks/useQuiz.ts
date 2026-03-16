import { useQuery } from '@tanstack/react-query'
import type { Quiz } from '@/types/quiz'
import { QuizService } from '@/api/client'

const QUIZ_QUERY_KEY = ['quiz'] as const

export const QUIZ_ONBOARDING_ID = 'quiz-1'

export function useQuiz(quizId: string) {
  return useQuery<Quiz>({
    queryKey: [...QUIZ_QUERY_KEY, quizId],
    queryFn: async () => {
      const data = await QuizService.quizControllerGetQuiz({ id: quizId })
      return data as Quiz
    },
    enabled: !!quizId,
  })
}
