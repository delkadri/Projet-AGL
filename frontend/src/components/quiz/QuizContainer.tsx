import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Quiz, QuizAnswers, Question } from '@/types/quiz'
import { AuthBranding } from '@/components/AuthBranding'
import { Button } from '@/components/ui/button'
import { mockQuiz } from '@/data/mockQuiz'
import { QuizProgress } from './QuizProgress'
import { QuizQuestion } from './QuizQuestion'

// TODO: charger le quiz via API (ex: useQuery getQuiz(id))
const quiz: Quiz = mockQuiz

function getCurrentQuestion(
  quiz: Quiz,
  categoryIndex: number,
  questionIndex: number
): Question | null {
  const category = quiz.categories[categoryIndex]
  if (!category) return null
  const question = category.questions[questionIndex]
  return question ?? null
}

function hasAnswer(question: Question, answers: QuizAnswers): boolean {
  const value = answers[question.id]
  if (question.type === 'single' || question.type === 'number') {
    return value !== undefined && value !== null && value !== ''
  }
  if (question.type === 'multiple') {
    return Array.isArray(value) && value.length > 0
  }
  return false
}

export function QuizContainer() {
  const navigate = useNavigate()
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})

  const category = quiz.categories[currentCategoryIndex]
  const questions = category?.questions ?? []
  const totalSteps = questions.length
  const currentQuestion = getCurrentQuestion(
    quiz,
    currentCategoryIndex,
    currentQuestionIndex
  )

  const setAnswer = (questionId: string, value: QuizAnswers[string]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const canContinue = currentQuestion
    ? hasAnswer(currentQuestion, answers)
    : false

  const goNext = () => {
    if (!category) return
    const nextQuestionIndex = currentQuestionIndex + 1
    if (nextQuestionIndex < questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex)
      return
    }
    const nextCategoryIndex = currentCategoryIndex + 1
    if (nextCategoryIndex < quiz.categories.length) {
      setCurrentCategoryIndex(nextCategoryIndex)
      setCurrentQuestionIndex(0)
      return
    }
    // Dernière question du quiz
    // TODO: soumettre les réponses à l'API
    navigate({ to: '/' })
  }

  if (!currentQuestion || !category) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">Aucune question disponible.</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f0f7f0]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 pb-24">
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden">
          <div className="overflow-hidden">
            <img src="/logo-vertical.png" alt="TerraScore" className="w-auto max-w-[250px] mx-auto object-contain sm:h-20 sm:max-w-[250px]" />
          </div>

          <div className="overflow-hidden pt-4">
            <QuizProgress
              categoryName={category.name}
              currentStep={currentQuestionIndex + 1}
              totalSteps={totalSteps}
            />
          </div>

          <div className="min-h-0 overflow-hidden pt-6">
            <QuizQuestion
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(value) => setAnswer(currentQuestion.id, value)}
              className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#f0f7f0] px-4 pb-6 pt-4">
        <Button
          type="button"
          disabled={!canContinue}
          className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={goNext}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}
