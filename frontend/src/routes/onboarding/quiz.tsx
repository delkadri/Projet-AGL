import { createFileRoute } from '@tanstack/react-router'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { mockQuiz } from '@/data/mockQuiz'

export const Route = createFileRoute('/onboarding/quiz')({
  component: QuizPage,
})

function QuizPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer
        quiz={mockQuiz}
        onFinishQuiz={{ label: 'Choisir mon parcours', to: '/onboarding/parcours' }}
      />
    </div>
  )
}
