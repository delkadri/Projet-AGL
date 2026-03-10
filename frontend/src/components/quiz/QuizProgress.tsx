type QuizProgressProps = {
  categoryName: string
  currentStep: number
  totalSteps: number
}

export function QuizProgress({
  categoryName,
  currentStep,
  totalSteps,
}: QuizProgressProps) {
  const percent = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="w-full space-y-1 text-center mx-auto">
      <p className="text-xs font-bold uppercase tracking-wide text-foreground">
        {categoryName}
      </p>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Etape {currentStep} sur {totalSteps}
      </p>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-300"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Etape ${currentStep} sur ${totalSteps}`}
      >
        <div
          className="h-full rounded-full bg-[#34C759] transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
