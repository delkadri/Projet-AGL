import { createFileRoute } from '@tanstack/react-router'
import { CarbonQuizContainer } from '@/components/quiz/CarbonQuizContainer'

export const Route = createFileRoute('/carbon-quiz-questions')({
  component: CarbonQuizQuestionsPage,
})

function CarbonQuizQuestionsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <CarbonQuizContainer />
    </div>
  )
}
