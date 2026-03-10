import { cn } from '@/lib/utils'

type QuestionMultipleChoiceOption = {
  label: string
  value: string
}

type QuestionMultipleChoiceProps = {
  options: QuestionMultipleChoiceOption[]
  value: string[]
  onChange: (value: string[]) => void
}

function toggleOption(selected: string[], optionValue: string): string[] {
  if (selected.includes(optionValue)) {
    return selected.filter((s) => s !== optionValue)
  }
  return [...selected, optionValue]
}

export function QuestionMultipleChoice({
  options,
  value,
  onChange,
}: QuestionMultipleChoiceProps) {
  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label="Choisissez une ou plusieurs réponses"
    >
      {options.map((option) => {
        const isSelected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            role="checkbox"
            aria-checked={isSelected}
            className={cn(
              'w-full rounded-xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-card-foreground shadow-sm transition-colors',
              isSelected
                ? 'border-[#34C759] bg-[#34C759]/10'
                : 'hover:bg-muted/50'
            )}
            onClick={() => onChange(toggleOption(value, option.value))}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
