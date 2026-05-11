import type { MonthlyQuizQuestionDto, MonthlyQuizResponseDto } from '@/api/client'
import type {
  Question,
  QuestionCarbonMeta,
  QuestionShowIf,
  Quiz,
  QuizAnswers,
  QuizCategory,
  QuizOption,
} from '@/types/quiz'

/** Préremplissage UI à partir du JSON stocké en base (score_history). */
export function baselineAnswersToQuizAnswers(
  raw: Record<string, unknown> | null | undefined,
): QuizAnswers {
  if (!raw) return {}
  const out: QuizAnswers = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string' || typeof v === 'number') {
      out[k] = v
    } else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
      out[k] = v as string[]
    }
  }
  return out
}

function mapOptions(opts: MonthlyQuizQuestionDto['options']): QuizOption[] {
  if (!opts?.length) return []
  return opts.map((o) => ({
    label: o.label,
    value: o.value,
    description: o.description,
  }))
}

function mapShowIf(raw: unknown): QuestionShowIf | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  if (typeof o.questionId !== 'string') return undefined
  const out: QuestionShowIf = { questionId: o.questionId }
  if ('value' in o) out.value = o.value as QuestionShowIf['value']
  if (o.operator === 'gt' || o.operator === 'gte' || o.operator === 'neq')
    out.operator = o.operator
  return out
}

function mapCarbonMeta(raw: unknown): QuestionCarbonMeta | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const o = raw as Record<string, unknown>
  if (typeof o.dataType !== 'string') return undefined
  return {
    dataType: o.dataType,
    ...(typeof o.poste === 'string' ? { poste: o.poste } : {}),
  }
}

/** Accepte les champs supplémentaires du JSON quiz (ex. clarification). */
type ApiQuestion = MonthlyQuizQuestionDto & { clarification?: string }

function mapQuestion(q: ApiQuestion): Question | null {
  const clarification = q.clarification
  const showIf = mapShowIf(q.showIf)
  const carbonMeta = mapCarbonMeta(q.carbonMeta)

  if (q.type === 'single') {
    const options = mapOptions(q.options)
    if (!options.length) return null
    return {
      id: q.id,
      type: 'single',
      title: q.title,
      description: q.description,
      clarification,
      options,
      carbonMeta,
      showIf,
    }
  }
  if (q.type === 'multiple') {
    const options = mapOptions(q.options)
    if (!options.length) return null
    return {
      id: q.id,
      type: 'multiple',
      title: q.title,
      description: q.description,
      clarification,
      options,
      carbonMeta,
      showIf,
    }
  }
  if (q.type === 'number') {
    const min = typeof q.min === 'number' ? q.min : 0
    const max = typeof q.max === 'number' ? q.max : 999
    return {
      id: q.id,
      type: 'number',
      title: q.title,
      description: q.description,
      clarification,
      min,
      max,
      carbonMeta,
      showIf,
    }
  }
  return null
}

/** Transforme la réponse API mensuelle en `Quiz` pour `QuizContainer`. */
export function monthlyQuizResponseDtoToQuiz(dto: MonthlyQuizResponseDto): Quiz {
  const categories: QuizCategory[] = dto.categories.map((c) => {
    const questions = c.questions
      .map((q) => mapQuestion(q as ApiQuestion))
      .filter((x): x is Question => x !== null)
    return {
      id: c.id,
      name: c.name,
      questions,
    }
  })
  return {
    id: dto.id,
    name: dto.name,
    categories,
  }
}
