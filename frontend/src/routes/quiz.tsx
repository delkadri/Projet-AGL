import { createFileRoute } from '@tanstack/react-router'
import { QuizContainer } from '@/components/quiz/QuizContainer'

export const Route = createFileRoute('/quiz')({
  component: QuizPage,
})

function QuizPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer />
    </div>
  )
}
