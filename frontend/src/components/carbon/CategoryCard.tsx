import type { ReactNode } from 'react'

export type CategoryCardProps = {
  name: string
  score: number
  maxScore: number
  percentage: number
  /** Contenu optionnel à droite du pourcentage (ex: bouton info) */
  trailing?: ReactNode
  /** Bloc dépliable affiché sous la jauge quand `expanded` est true */
  expandableContent?: ReactNode
  expanded?: boolean
}

export function CategoryCard({
  name,
  score,
  maxScore,
  percentage,
  trailing,
  expandableContent,
  expanded = false,
}: CategoryCardProps) {
  const getBarColor = (percent: number) => {
    if (percent <= 33) return 'bg-green-500'
    if (percent <= 66) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex justify-between items-center gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm truncate min-w-0">{name}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium text-gray-600">
            {score.toFixed(1)} / {maxScore.toFixed(1)} t ({percentage}%)
          </span>
          {trailing}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getBarColor(percentage)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {expanded && expandableContent != null && (
        <div className="border-t border-gray-100 mt-3 pt-3 -mx-3 px-3 bg-gray-50/80">
          {expandableContent}
        </div>
      )}
    </div>
  )
}
