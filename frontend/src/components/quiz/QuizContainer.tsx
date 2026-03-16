import { useState, useMemo } from 'react'
import type { Quiz, QuizAnswers, Question } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { QuizProgress } from './QuizProgress'
import { QuizQuestion } from './QuizQuestion'
import { QuizResult } from './QuizResult'
import { QuizService } from '@/api/client'
import type { ApiError } from '@/api/client'
import type { QuizCalculateScoreResponse } from './QuizResult'

export type QuizFinishAction = {
  label: string
  to: string
}

type QuizContainerProps = {
  quiz: Quiz
  /** Action affichée dans le bilan à la fin du quiz (bouton). Si absent, redirection vers / */
  onFinishQuiz?: QuizFinishAction
}

/** Visible step: (categoryIndex, questionIndex) into quiz.categories[].questions[]. */
type VisibleStep = { categoryIndex: number; questionIndex: number }

function isQuestionVisible(question: Question, answers: QuizAnswers): boolean {
  const showIf = question.showIf
  if (!showIf) return true
  const depAnswer = answers[showIf.questionId]
  if (showIf.operator === 'gt' && typeof showIf.value === 'number') {
    const num = typeof depAnswer === 'number' ? depAnswer : typeof depAnswer === 'string' ? parseInt(depAnswer, 10) : NaN
    return Number.isFinite(num) && num > showIf.value
  }
  if (showIf.operator === 'gte' && typeof showIf.value === 'number') {
    const num = typeof depAnswer === 'number' ? depAnswer : typeof depAnswer === 'string' ? parseInt(depAnswer, 10) : NaN
    return Number.isFinite(num) && num >= showIf.value
  }
  if (showIf.operator === 'neq' && showIf.value !== undefined) {
    return depAnswer !== showIf.value
  }
  if (showIf.value !== undefined) {
    if (Array.isArray(showIf.value)) return Array.isArray(depAnswer) && showIf.value.some((v) => depAnswer.includes(v))
    return depAnswer === showIf.value
  }
  return depAnswer !== undefined && depAnswer !== null && depAnswer !== ''
}

function getVisibleSteps(quiz: Quiz, answers: QuizAnswers): VisibleStep[] {
  const steps: VisibleStep[] = []
  quiz.categories.forEach((category, categoryIndex) => {
    category.questions.forEach((question, questionIndex) => {
      if (isQuestionVisible(question, answers)) steps.push({ categoryIndex, questionIndex })
    })
  })
  return steps
}

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

export function QuizContainer({ quiz, onFinishQuiz }: QuizContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizCalculateScoreResponse | null>(null)

  const visibleSteps = useMemo(() => getVisibleSteps(quiz, answers), [quiz, answers])
  const totalSteps = visibleSteps.length

  const setAnswer = (questionId: string, value: QuizAnswers[string]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  // If current step is past the end (e.g. a question was hidden after answer change), clamp to last visible step
  const safeStepIndex = currentStepIndex >= visibleSteps.length ? Math.max(0, visibleSteps.length - 1) : currentStepIndex
  const effectiveStep = visibleSteps[safeStepIndex] ?? null
  const effectiveCategory = effectiveStep ? quiz.categories[effectiveStep.categoryIndex] : null
  const effectiveQuestion = effectiveStep
    ? getCurrentQuestion(quiz, effectiveStep.categoryIndex, effectiveStep.questionIndex)
    : null

  const canContinue = effectiveQuestion
    ? hasAnswer(effectiveQuestion, answers)
    : false

  const goNext = async () => {
    if (!effectiveCategory || !effectiveQuestion) return
    setSubmitError(null)
    const nextStepIndex = safeStepIndex + 1
    if (nextStepIndex < visibleSteps.length) {
      setCurrentStepIndex(nextStepIndex)
      return
    }
    // Dernière question du quiz: soumettre les réponses et afficher le résultat
    try {
      setIsSubmitting(true)
      const scoreResult = (await QuizService.quizControllerCalculateScore({
        id: quiz.id,
        requestBody: { answers },
      })) as QuizCalculateScoreResponse
      setResult(scoreResult)
    } catch (err) {
      const apiErr = err as ApiError | undefined
      if (apiErr?.status === 400) {
        setSubmitError("Certaines réponses ne sont pas valides. Veuillez réessayer.")
      } else {
        setSubmitError("Une erreur est survenue lors du calcul du score. Veuillez réessayer.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <QuizResult
        result={result}
        finishAction={onFinishQuiz ?? { label: 'Retour à l’accueil', to: '/' }}
      />
    )
  }

  if (!effectiveQuestion || !effectiveCategory || totalSteps === 0) {
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
              categoryName={effectiveCategory.name}
              currentStep={safeStepIndex + 1}
              totalSteps={totalSteps}
            />
          </div>

          <div className="min-h-0 overflow-hidden pt-6">
            <QuizQuestion
              question={effectiveQuestion}
              value={answers[effectiveQuestion.id]}
              onChange={(value) => setAnswer(effectiveQuestion.id, value)}
              className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#f0f7f0] px-4 pb-6 pt-4">
        {submitError && (
          <p className="mb-3 text-sm font-medium text-red-700">
            {submitError}
          </p>
        )}
        <Button
          type="button"
          disabled={!canContinue || isSubmitting}
          className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={goNext}
        >
          {isSubmitting ? 'Calcul en cours…' : 'Continuer'}
        </Button>
      </div>
    </div>
  )
}
