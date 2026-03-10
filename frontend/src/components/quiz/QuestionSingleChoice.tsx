import { cn } from '@/lib/utils'

type QuestionSingleChoiceOption = {
  label: string
  value: string
}

type QuestionSingleChoiceProps = {
  options: QuestionSingleChoiceOption[]
  value: string | null
  onChange: (value: string) => void
}

export function QuestionSingleChoice({
  options,
  value,
  onChange,
}: QuestionSingleChoiceProps) {
  return (
    <div
      className="flex flex-col gap-3"
      role="radiogroup"
      aria-label="Choisissez une réponse"
    >
      {options.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={cn(
              'w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-card-foreground shadow-sm transition-colors',
              isSelected
                ? 'border-[#34C759] bg-[#34C759]/10'
                : 'hover:bg-muted/50'
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
