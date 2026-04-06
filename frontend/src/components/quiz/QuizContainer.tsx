import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Quiz, QuizAnswers, Question } from '@/types/quiz'
import { Button } from '@/components/ui/button'
import { QuizProgress } from './QuizProgress'
import { QuizQuestion } from './QuizQuestion'
import { QuizResult } from './QuizResult'
import { QuizService } from '@/api/client'
import type { ApiError } from '@/api/client'
import type { QuizCalculateScoreResponse } from './QuizResult'
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuizFinishAction = {
  label: string
  to: string
}

type QuizContainerProps = {
  quiz: Quiz
  onFinishQuiz?: QuizFinishAction
}

type VisibleStep = { categoryIndex: number; questionIndex: number }

type PreviewCategory = {
  id: string
  name: string
  totalKgCo2ePerYear: number
}

type PreviewResult = { categories: PreviewCategory[] }

// ─── Helpers ────────────────────────────────────────────────────────────────

function isQuestionVisible(question: Question, answers: QuizAnswers): boolean {
  const showIf = question.showIf
  if (!showIf) return true
  const dep = answers[showIf.questionId]
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

function getVisibleSteps(quiz: Quiz, answers: QuizAnswers): VisibleStep[] {
  const steps: VisibleStep[] = []
  quiz.categories.forEach((cat, ci) =>
    cat.questions.forEach((q, qi) => {
      if (isQuestionVisible(q, answers)) steps.push({ categoryIndex: ci, questionIndex: qi })
    }),
  )
  return steps
}

function hasAnswer(question: Question, answers: QuizAnswers): boolean {
  const v = answers[question.id]
  if (question.type === 'single' || question.type === 'number')
    return v !== undefined && v !== null && v !== ''
  if (question.type === 'multiple') return Array.isArray(v) && v.length > 0
  return false
}

function formatDelta(kg: number): string {
  const abs = Math.abs(kg)
  const sign = kg >= 0 ? '+' : '−'
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)} t CO₂e/an`
  return `${sign}${Math.round(abs)} kg CO₂e/an`
}

/** Quand le score catégorie ne bouge pas encore (ex. distance non renseignée), pas de verdict chiffré. */
const NEUTRAL_DELTA_FALLBACK =
  "L'impact sur cette catégorie sera calculé après les prochaines questions."

// ─── Component ──────────────────────────────────────────────────────────────

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

  const safeIdx = currentStepIndex >= visibleSteps.length ? Math.max(0, visibleSteps.length - 1) : currentStepIndex
  const step = visibleSteps[safeIdx] ?? null
  const category = step ? quiz.categories[step.categoryIndex] : null
  const question = step ? (quiz.categories[step.categoryIndex]?.questions[step.questionIndex] ?? null) : null
  const canContinue = question ? hasAnswer(question, answers) : false

  // Answers without the current question — used as "base" for delta
  const answersWithoutCurrent = useMemo(() => {
    if (!question) return answers
    const copy = { ...answers }
    delete copy[question.id]
    return copy
  }, [answers, question?.id])

  // Base preview: loaded eagerly so it's ready before the user selects
  const { data: baseData } = useQuery<PreviewResult>({
    queryKey: ['qprev-base', quiz.id, question?.id, JSON.stringify(answersWithoutCurrent)],
    queryFn: async () =>
      (await QuizService.quizControllerPreviewScore({
        id: quiz.id,
        requestBody: { answers: answersWithoutCurrent },
      })) as PreviewResult,
    enabled: !!question,
    staleTime: 120_000,
  })

  // Current preview: loaded once the user has answered
  const { data: currentData, isFetching: previewLoading } = useQuery<PreviewResult>({
    queryKey: ['qprev-cur', quiz.id, JSON.stringify(answers)],
    queryFn: async () =>
      (await QuizService.quizControllerPreviewScore({
        id: quiz.id,
        requestBody: { answers },
      })) as PreviewResult,
    enabled: canContinue,
    staleTime: 120_000,
  })

  // Delta for the current category (marginal impact of answering this question)
  const categoryDeltaKg = useMemo(() => {
    if (!currentData || !category) return null
    const cur = currentData.categories.find((c) => c.id === category.id)?.totalKgCo2ePerYear ?? 0
    const base = baseData?.categories.find((c) => c.id === category.id)?.totalKgCo2ePerYear ?? 0
    return cur - base
  }, [currentData, baseData, category?.id])

  // Description of the selected option (falls back to question description)
  const selectedDescription = useMemo(() => {
    if (!question || !canContinue) return null
    if (question.type === 'single') {
      const val = answers[question.id] as string
      return question.options.find((o) => o.value === val)?.description ?? question.description ?? null
    }
    if (question.type === 'multiple') {
      return question.description ?? null
    }
    return question.description ?? null
  }, [question, answers, canContinue])

  const goNext = async () => {
    if (!category || !question) return
    setSubmitError(null)
    const next = safeIdx + 1
    if (next < visibleSteps.length) {
      setCurrentStepIndex(next)
      return
    }
    try {
      setIsSubmitting(true)
      const r = (await QuizService.quizControllerCalculateScore({
        id: quiz.id,
        requestBody: { answers },
      })) as QuizCalculateScoreResponse
      setResult(r)
    } catch (err) {
      const apiErr = err as ApiError | undefined
      setSubmitError(
        apiErr?.status === 400
          ? 'Certaines réponses ne sont pas valides. Veuillez réessayer.'
          : 'Une erreur est survenue lors du calcul du score. Veuillez réessayer.',
      )
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

  // ── derive delta display ────────────────────────────────────────────────
  const showPanel = canContinue
  const NEUTRAL_THRESHOLD_KG = 5

  const deltaPositive = categoryDeltaKg !== null && categoryDeltaKg > NEUTRAL_THRESHOLD_KG
  const deltaNegative = categoryDeltaKg !== null && categoryDeltaKg < -NEUTRAL_THRESHOLD_KG
  const deltaNeutral = categoryDeltaKg !== null && !deltaPositive && !deltaNegative

  const panelSecondaryLine =
    selectedDescription ?? (deltaNeutral ? NEUTRAL_DELTA_FALLBACK : null)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f0f7f0]">
      {/* Scrollable content — extra bottom padding when panel is visible */}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 transition-[padding] duration-200',
          showPanel ? 'pb-44' : 'pb-24',
        )}
      >
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
              value={answers[question.id]}
              onChange={(v) => setAnswer(question.id, v)}
              className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom zone */}
      <div className="fixed bottom-0 left-0 right-0 space-y-2.5 bg-[#f0f7f0] px-4 pb-6 pt-3">

        {/* Impact panel — visible after the user selects an answer */}
        {showPanel && (
          <div
            className={cn(
              'overflow-hidden rounded-xl border px-3 py-2.5 transition-colors duration-300',
              deltaPositive
                ? 'border-red-200 bg-red-50'
                : deltaNegative
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-gray-200 bg-gray-50',
            )}
          >
            {previewLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>Calcul de l'impact…</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {/* Verdict chiffré uniquement si le breakdown catégorie bouge vraiment */}
                {categoryDeltaKg !== null && !deltaNeutral && (
                  <div
                    className={cn(
                      'flex items-center gap-1.5',
                      deltaPositive
                        ? 'text-red-600'
                        : deltaNegative
                          ? 'text-emerald-600'
                          : 'text-gray-500',
                    )}
                  >
                    {deltaPositive && <TrendingUp className="h-4 w-4 shrink-0" />}
                    {deltaNegative && <TrendingDown className="h-4 w-4 shrink-0" />}
                    <span className="text-sm font-bold">{formatDelta(categoryDeltaKg)}</span>
                    <span className="text-xs opacity-70">sur {category.name.toLowerCase()}</span>
                  </div>
                )}

                {panelSecondaryLine && (
                  <p
                    className={cn(
                      'line-clamp-2 text-xs leading-snug',
                      deltaPositive
                        ? 'text-red-900/70'
                        : deltaNegative
                          ? 'text-emerald-900/70'
                          : 'text-gray-600',
                    )}
                  >
                    {panelSecondaryLine}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

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
