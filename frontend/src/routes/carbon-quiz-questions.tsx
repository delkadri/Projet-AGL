import { createFileRoute } from '@tanstack/react-router'
import { QuizContainer } from '@/components/quiz/QuizContainer'
import { mockCarbonQuizData } from '@/data/mockCarbonQuizData'

export const Route = createFileRoute('/carbon-quiz-questions')({
  component: CarbonQuizQuestionsPage,
})

function CarbonQuizQuestionsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f0f7f0]">
      <QuizContainer quiz={mockCarbonQuizData} />
    </div>
  )
}
