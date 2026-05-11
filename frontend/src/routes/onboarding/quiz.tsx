import { createFileRoute, redirect } from '@tanstack/react-router'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { useQuiz, QUIZ_ONBOARDING_ID } from '@/api/hooks/useQuiz'
import { Button } from '@/components/ui/button'
import { readStoredAuthUser } from '@/lib/stored-auth-user'

export const Route = createFileRoute('/onboarding/quiz')({
  beforeLoad: () => {
    const user = readStoredAuthUser()
    if (user && !user.onboardingCompleted && user.hasOnboardingBilan) {
      throw redirect({ to: '/onboarding/parcours' })
    }
  },
  component: QuizPage,
})

function QuizPage() {
  const { data: quiz, isLoading, isError, error, refetch } = useQuiz(QUIZ_ONBOARDING_ID)

  if (isLoading) {
    return (
      <div className="flex h-dvh min-h-0 flex-col items-center justify-center gap-4 bg-[#f0f7f0]">
        <p className="text-[#1b5e20]">Chargement du quiz...</p>
      </div>
    )
  }

  if (isError || !quiz) {
    return (
      <div className="flex h-dvh min-h-0 flex-col items-center justify-center gap-4 bg-[#f0f7f0] px-4">
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
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer
        quiz={quiz}
        quizResultVariant="onboarding"
        onFinishQuiz={{ label: 'Poursuivre', to: '/onboarding/parcours' }}
      />
    </div>
  )
}
