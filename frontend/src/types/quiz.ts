/** Option used by single and multiple choice questions */
export type QuizOption = {
  label: string
  value: string
}

/** Optional carbon-related metadata to help backend/APIs map questions to ADEME/Base Carbone logic */
export type QuestionCarbonMeta = {
  poste?: string
  dataType:
    | 'principal_mode'
    | 'distance_km'
    | 'modes_used'
    | 'flight_count'
    | 'flight_distance_class'
    | 'telework_factor'
}

/** Question with single choice (one option) */
export type QuestionSingle = {
  id: string
  type: 'single'
  title: string
  options: QuizOption[]
  carbonMeta?: QuestionCarbonMeta
}

/** Question with multiple choice (several options) */
export type QuestionMultiple = {
  id: string
  type: 'multiple'
  title: string
  options: QuizOption[]
  carbonMeta?: QuestionCarbonMeta
}

/** Question with numeric answer in a range */
export type QuestionNumber = {
  id: string
  type: 'number'
  title: string
  min: number
  max: number
  carbonMeta?: QuestionCarbonMeta
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
