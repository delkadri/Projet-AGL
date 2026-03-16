import { createFileRoute } from '@tanstack/react-router'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { useQuiz, QUIZ_ONBOARDING_ID } from '@/api/hooks/useQuiz'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/onboarding/quiz')({
  component: QuizPage,
})

function QuizPage() {
  const { data: quiz, isLoading, isError, error, refetch } = useQuiz(QUIZ_ONBOARDING_ID)

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f0]">
        <p className="text-[#1b5e20]">Chargement du quiz...</p>
      </div>
    )
  }

  if (isError || !quiz) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#f0f7f0] px-4">
        <p className="text-center text-red-600">
          {error instanceof Error ? error.message : 'Impossible de charger le quiz.'}
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Réessayer
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer
        quiz={quiz}
        onFinishQuiz={{ label: 'Choisir mon parcours', to: '/onboarding/parcours' }}
      />
    </div>
  )
}
