interface CarbonScoreCircleProps {
  score: number
  message?: string
}

export function CarbonScoreCircle({ score, message }: CarbonScoreCircleProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* Score Circle */}
      <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex flex-col items-center justify-center shadow-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-white">{score.toFixed(1)}</div>
          <div className="text-xs font-semibold text-white mt-1">CO2e/an</div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <p className="text-center text-gray-700 font-medium text-sm px-4">
          {message}
          <br />
          <span className="text-gray-600">Voici les détails :</span>
        </p>
      )}
    </div>
  )
}
