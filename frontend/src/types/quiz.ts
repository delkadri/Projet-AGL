/** Option used by single and multiple choice questions */
export type QuizOption = {
  label: string
  value: string
}

/** Optional carbon-related metadata to help backend/APIs map questions to ADEME/Base Carbone logic */
export type QuestionCarbonMeta = {
  poste?: string
  /** Free-form identifier used by the backend scorer (e.g. 'principal_mode', 'diet_type'…). */
  dataType: string
}

/** Condition to show a question only when another answer matches (e.g. show motorisation only if mode = car). */
export type QuestionShowIf = {
  /** Id of the question whose answer controls visibility. */
  questionId: string
  /** If set, visibility depends on equality (single/multiple) or, with operator, on numeric comparison. */
  value?: string | number | string[]
  /** For numeric comparison: gt, gte. For equality: neq = show when answer is not equal to value. */
  operator?: 'gt' | 'gte' | 'neq'
}

/** Question with single choice (one option) */
export type QuestionSingle = {
  id: string
  type: 'single'
  title: string
  options: QuizOption[]
  carbonMeta?: QuestionCarbonMeta
  /** If set, this question is only shown when the condition is satisfied. */
  showIf?: QuestionShowIf
}

/** Question with multiple choice (several options) */
export type QuestionMultiple = {
  id: string
  type: 'multiple'
  title: string
  options: QuizOption[]
  carbonMeta?: QuestionCarbonMeta
  showIf?: QuestionShowIf
}

/** Question with numeric answer in a range */
export type QuestionNumber = {
  id: string
  type: 'number'
  title: string
  min: number
  max: number
  carbonMeta?: QuestionCarbonMeta
  showIf?: QuestionShowIf
}

export type Question = QuestionSingle | QuestionMultiple | QuestionNumber

export type QuizCategory = {
  id: string
  name: string
  questions: Question[]
}

export type Quiz = {
  id: string
  name: string
  categories: QuizCategory[]
}

/** Answer value per question: string for single, string[] for multiple, number for number */
export type QuestionAnswer = string | string[] | number

export type QuizAnswers = Record<string, QuestionAnswer>

export type QuizAnswerEntry = {
  questionId: string
  categoryId: string
  value: QuestionAnswer
  /** Optional normalized codes for choice questions (single/multiple) */
  optionValues?: string[]
}

export type QuizSubmissionPayload = {
  quizId: string
  submittedAt: string
  answers: QuizAnswerEntry[]
  /** Optional schema or quiz version for compatibility */
  schemaVersion?: string
}
