/** Question with single choice (one option) */
export type QuestionSingle = {
  id: string
  type: 'single'
  title: string
  options: string[]
}

/** Question with multiple choice (several options) */
export type QuestionMultiple = {
  id: string
  type: 'multiple'
  title: string
  options: string[]
}

/** Question with numeric answer in a range */
export type QuestionNumber = {
  id: string
  type: 'number'
  title: string
  min: number
  max: number
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
