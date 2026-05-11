import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { mockCarbonQuizData } from '@/data/mockCarbonQuizData'
import { useMonthlyQuizCurrent } from '@/api/hooks/useMonthlyQuizCurrent'
import {
  baselineAnswersToQuizAnswers,
  monthlyQuizResponseDtoToQuiz,
} from '@/lib/monthly-quiz-to-quiz'
import { Button } from '@/components/ui/button'

type CarbonQuizSearch = {
  source?: 'monthly'
}

export const Route = createFileRoute('/carbon-quiz-questions')({
  validateSearch: (raw: Record<string, unknown>): CarbonQuizSearch => ({
    source: raw.source === 'monthly' ? 'monthly' : undefined,
  }),
  component: CarbonQuizQuestionsPage,
})

function CarbonQuizQuestionsPage() {
  const { source } = Route.useSearch()
  const isMonthly = source === 'monthly'
  const { data, isLoading, isError } = useMonthlyQuizCurrent(isMonthly)

  const quiz = useMemo(() => {
    if (isMonthly && data?.quiz) return monthlyQuizResponseDtoToQuiz(data.quiz)
    return mockCarbonQuizData
  }, [isMonthly, data?.quiz])

  const initialBaseline = useMemo(() => {
    if (!isMonthly || !data?.baselineAnswers) return undefined
    return baselineAnswersToQuizAnswers(data.baselineAnswers)
  }, [isMonthly, data?.baselineAnswers])

  if (isMonthly && isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#f0f7f0] px-4">
        <p className="text-center text-[#1C5138]">Chargement du quiz…</p>
      </div>
    )
  }

  if (isMonthly && (isError || (data && !data.quiz))) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f0] px-4">
        <p className="max-w-sm text-center text-slate-700">
          {isError
            ? 'Impossible de charger le quiz. Vérifiez votre connexion ou réessayez.'
            : 'Le quiz de ce mois est déjà enregistré.'}
        </p>
        <Button type="button" asChild className="bg-[#1A4D3E] hover:bg-[#153936]">
          <Link to="/donnees">Retour à la mise à jour des données</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer
        quiz={quiz}
        scoreMode={isMonthly ? 'monthly_update' : 'full_quiz'}
        initialBaselineAnswers={initialBaseline}
        onFinishQuiz={{ label: 'Retour à la mise à jour des données', to: '/donnees' }}
      />
    </div>
  )
}
