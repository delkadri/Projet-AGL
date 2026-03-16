export function CategoryCard({
  name,
  score,
  maxScore,
  percentage,
}: CategoryCardProps) {
  // Couleur de la jauge basée sur le pourcentage
  const getBarColor = (percent: number) => {
    if (percent <= 33) return 'bg-green-500'
    if (percent <= 66) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
        <span className="text-xs font-medium text-gray-600">
          {score.toFixed(1)} / {maxScore.toFixed(1)} t ({percentage}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
