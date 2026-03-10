type QuestionNumberProps = {
  min: number
  max: number
  value: number | null
  onChange: (value: number) => void
}

export function QuestionNumber({
  min,
  max,
  value,
  onChange,
}: QuestionNumberProps) {
  const numValue = value ?? min

  const percent =
    max > min ? ((numValue - min) / (max - min)) * 100 : 0

  return (
    <div className="space-y-1 mx-4">
      <div
        className="flex justify-between text-sm font-medium text-foreground"
        aria-hidden
      >
        <span className="text-foreground relative -bottom-10">{min}</span>
        <span className="text-foreground relative -bottom-10 right-0">{max}</span>
      </div>

      <div className="relative pt-10 pb-1">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={numValue}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`Valeur entre ${min} et ${max}`}
          className="absolute inset-x-0 top-8 z-10 h-6 w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none"
        />

        <div
          className="relative h-4 w-full rounded-full bg-[#34C759]/10"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 rounded-l-full bg-[#34C759] transition-[width] duration-100"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div
          className="absolute z-20 flex size-9 items-center justify-center rounded-full border-2 border-white bg-foreground text-sm font-semibold text-primary-foreground shadow-md"
          style={{
            left: `calc(${percent}% - 18px)`,
            top: 0,
          }}
          aria-hidden
        >
          {numValue}
        </div>
      </div>

      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 0;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          width: 2px;
          height: 24px;
          border-radius: 1px;
          background: oklch(0.205 0 0);
          margin-top: -12px;
        }
        input[type="range"]::-moz-range-track {
          height: 0;
          background: transparent;
        }
        input[type="range"]::-moz-range-thumb {
          width: 2px;
          height: 24px;
          border-radius: 1px;
          background: oklch(0.205 0 0);
        }
      `}</style>
    </div>
  )
}
