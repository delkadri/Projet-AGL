import { cn } from '@/lib/utils'

type QuestionSingleChoiceProps = {
  options: string[]
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
        const isSelected = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={cn(
              'w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-card-foreground shadow-sm transition-colors',
              isSelected
                ? 'border-[#34C759] bg-[#34C759]/10'
                : 'hover:bg-muted/50'
            )}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
