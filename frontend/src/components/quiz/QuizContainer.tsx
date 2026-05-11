import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Quiz, QuizAnswers, Question } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { QuizProgress } from './QuizProgress'
import { QuizQuestion } from './QuizQuestion'
import { QuizResult } from './QuizResult'
import { ApiError, QuizService } from '@/api/client'
import { MonthlyQuizService } from '@/api/client/services/MonthlyQuizService'
import { getUserFacingApiMessage } from '@/lib/api-user-message'
import type { QuizCalculateScoreResponse } from './QuizResult'
import { enregistrerQuizDuMoisCommeFait, QUIZ_DU_MOIS_QUIZ_ID } from '@/lib/quiz-du-mois-etat'
import { MONTHLY_QUIZ_CURRENT_QUERY_KEY } from '@/api/hooks/useMonthlyQuizCurrent'
import { ONBOARDING_QUIZ_RESULT_QUERY_KEY } from '@/api/hooks/useOnboardingQuizResult'
import { cn } from '@/lib/utils'

export type QuizFinishAction = {
  label: string
  to: string
}

export type QuizScoreMode = 'full_quiz' | 'monthly_update'

type QuizContainerProps = {
  quiz: Quiz
  scoreMode?: QuizScoreMode
  /** Réponses du dernier bilan (quiz mensuel) pour showIf et préremplissage. */
  initialBaselineAnswers?: QuizAnswers
  onFinishQuiz?: QuizFinishAction
}

type VisibleStep = { categoryIndex: number; questionIndex: number }

const EMPTY_QUIZ_ANSWERS: QuizAnswers = {}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isQuestionVisible(question: Question, answers: QuizAnswers | null | undefined): boolean {
  const a = answers ?? {}
  const showIf = question.showIf
  if (!showIf) return true
  const dep = a[showIf.questionId]
  if (showIf.operator === 'gt' && typeof showIf.value === 'number') {
    const n = typeof dep === 'number' ? dep : typeof dep === 'string' ? parseInt(dep, 10) : NaN
    return Number.isFinite(n) && n > showIf.value
  }
  if (showIf.operator === 'gte' && typeof showIf.value === 'number') {
    const n = typeof dep === 'number' ? dep : typeof dep === 'string' ? parseInt(dep, 10) : NaN
    return Number.isFinite(n) && n >= showIf.value
  }
  if (showIf.operator === 'neq' && showIf.value !== undefined) return dep !== showIf.value
  if (showIf.value !== undefined) {
    if (Array.isArray(showIf.value)) return Array.isArray(dep) && showIf.value.some((v) => dep.includes(v))
    return dep === showIf.value
  }
  return dep !== undefined && dep !== null && dep !== ''
}

function getVisibleSteps(quiz: Quiz, answers: QuizAnswers | null | undefined): VisibleStep[] {
  const steps: VisibleStep[] = []
  quiz.categories.forEach((cat, ci) =>
    cat.questions.forEach((q, qi) => {
      if (isQuestionVisible(q, answers)) steps.push({ categoryIndex: ci, questionIndex: qi })
    }),
  )
  return steps
}

function hasAnswer(question: Question, answers: QuizAnswers | null | undefined): boolean {
  const v = (answers ?? {})[question.id]
  if (question.type === 'single' || question.type === 'number')
    return v !== undefined && v !== null && v !== ''
  if (question.type === 'multiple') return Array.isArray(v) && v.length > 0
  return false
}

/** Texte affiché dans la dialog « ? » : clarification, contexte, puis précisions des choix. */
function buildQuestionHelpContent(question: Question): string | null {
  const text = question.clarification?.trim()
  return text && text.length > 0 ? text : null
}

// ─── Component ──────────────────────────────────────────────────────────────

export function QuizContainer({
  quiz,
  scoreMode = 'full_quiz',
  initialBaselineAnswers,
  onFinishQuiz,
}: QuizContainerProps) {
  const queryClient = useQueryClient()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<QuizCalculateScoreResponse | null>(null)
  const baselineMergedRef = useRef(false)

  useEffect(() => {
    baselineMergedRef.current = false
  }, [quiz.id])

  useEffect(() => {
    if (scoreMode !== 'monthly_update') return
    const baseline = initialBaselineAnswers
    if (!baseline || Object.keys(baseline).length === 0) return
    if (baselineMergedRef.current) return
    baselineMergedRef.current = true
    setAnswers((prev) => ({ ...baseline, ...prev }))
  }, [scoreMode, initialBaselineAnswers])

  const answersRecord = answers ?? EMPTY_QUIZ_ANSWERS

  const visibleSteps = useMemo(() => getVisibleSteps(quiz, answersRecord), [quiz, answersRecord])
  const totalSteps = visibleSteps.length

  const setAnswer = (questionId: string, value: QuizAnswers[string]) => {
    setAnswers((prev) => ({ ...(prev ?? {}), [questionId]: value }))
  }

  const safeIdx = currentStepIndex >= visibleSteps.length ? Math.max(0, visibleSteps.length - 1) : currentStepIndex
  const step = visibleSteps[safeIdx] ?? null
  const category = step ? quiz.categories[step.categoryIndex] : null
  const question = step ? (quiz.categories[step.categoryIndex]?.questions[step.questionIndex] ?? null) : null
  const canContinue = question ? hasAnswer(question, answersRecord) : false

  const questionHelpContent = question ? buildQuestionHelpContent(question) : null

  const goNext = async () => {
    if (!category || !question) return
    setSubmitError(null)
    const next = safeIdx + 1
    if (next < visibleSteps.length) {
      setCurrentStepIndex(next)
      return
    }
    const scoreTimeoutMs = 60_000
    try {
      setIsSubmitting(true)
      if (scoreMode === 'monthly_update') {
        const r = (await Promise.race([
          MonthlyQuizService.monthlyQuizControllerSubmitMonthlyQuiz({
            id: quiz.id,
            requestBody: { answers: answersRecord },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  Object.assign(new Error('timeout'), { name: 'ScoreTimeoutError' }),
                ),
              scoreTimeoutMs,
            ),
          ),
        ])) as QuizCalculateScoreResponse
        await queryClient.invalidateQueries({ queryKey: MONTHLY_QUIZ_CURRENT_QUERY_KEY })
        await queryClient.invalidateQueries({ queryKey: ONBOARDING_QUIZ_RESULT_QUERY_KEY })
        setResult(r)
      } else {
        const r = (await Promise.race([
          QuizService.quizControllerCalculateScore({
            id: quiz.id,
            requestBody: { answers: answersRecord },
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () =>
                reject(
                  Object.assign(new Error('timeout'), { name: 'ScoreTimeoutError' }),
                ),
              scoreTimeoutMs,
            ),
          ),
        ])) as QuizCalculateScoreResponse
        if (quiz.id === QUIZ_DU_MOIS_QUIZ_ID) {
          enregistrerQuizDuMoisCommeFait()
        }
        setResult(r)
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === 'ScoreTimeoutError'
      if (isTimeout) {
        setSubmitError(
          'Le calcul a pris trop de temps (réseau ou serveur lent). Réessayez dans un instant.',
        )
      } else if (err instanceof ApiError) {
        const apiMsg = getUserFacingApiMessage(err)
        if (err.status === 409) {
          setSubmitError(
            apiMsg ??
              'Un bilan a déjà été enregistré pour ce mois civil (UTC). Un seul enregistrement par mois et par année est autorisé.',
          )
        } else if (err.status === 400) {
          setSubmitError(apiMsg ?? 'Certaines réponses ne sont pas valides. Veuillez réessayer.')
        } else {
          setSubmitError(
            apiMsg ?? 'Une erreur est survenue lors du calcul du score. Veuillez réessayer.',
          )
        }
      } else {
        setSubmitError('Une erreur est survenue lors du calcul du score. Veuillez réessayer.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (result) {
    return (
      <QuizResult
        result={result}
        finishAction={onFinishQuiz ?? { label: "Retour à l'accueil", to: '/' }}
      />
    )
  }

  if (!question || !category || totalSteps === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">Aucune question disponible.</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f0f7f0]">
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 pb-24')}>
        <div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)] overflow-hidden">
          <div className="overflow-hidden">
            <h1 className="text-center text-2xl font-bold text-[#1C5138]">
              Calcul de votre score carbone
            </h1>
          </div>
          <div className="overflow-hidden pt-4">
            <QuizProgress
              categoryName={category.name}
              currentStep={safeIdx + 1}
              totalSteps={totalSteps}
            />
          </div>
          <div className="min-h-0 overflow-hidden pt-6">
            <QuizQuestion
              question={question}
              value={answersRecord[question.id]}
              onChange={(v) => setAnswer(question.id, v)}
              helpContent={questionHelpContent}
              className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 space-y-2.5 bg-[#f0f7f0] px-4 pb-6 pt-3">
        {submitError && (
          <p className="text-sm font-medium text-red-700">{submitError}</p>
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
