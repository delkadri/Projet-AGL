import type { Question, QuestionAnswer } from '@/types/quiz'
import { cn } from '@/lib/utils'
import { QuestionMultipleChoice } from './QuestionMultipleChoice'
import { QuestionNumber } from './QuestionNumber'
import { QuestionSingleChoice } from './QuestionSingleChoice'

type QuizQuestionProps = {
  question: Question
  value: QuestionAnswer | undefined
  onChange: (value: QuestionAnswer) => void
  className?: string
}

export function QuizQuestion({ question, value, onChange, className }: QuizQuestionProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <h2 className="shrink-0 text-base font-bold leading-tight text-foreground decoration-muted-foreground/30 underline-offset-2">
        {question.title}
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-4">
        {question.type === 'single' && (
          <QuestionSingleChoice
            options={question.options}
            value={(value as string | undefined) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'multiple' && (
          <QuestionMultipleChoice
            options={question.options}
            value={((value as string[] | undefined) ?? []) as string[]}
            onChange={(v) => onChange(v)}
          />
        )}
        {question.type === 'number' && (
          <QuestionNumber
            min={question.min}
            max={question.max}
            value={(value as number | undefined) ?? null}
            onChange={(v) => onChange(v)}
          />
        )}
      </div>
    </div>
  )
}
