import { Button } from '@/components/ui/button'
import { Leaf, TrendingDown, TrendingUp } from 'lucide-react'
import { useScoreHistory } from '@/api/hooks/useScoreHistory'

const FRENCH_AVERAGE = 10 // tonnes CO2e/an
const MAX_GAUGE = 20 // tonnes CO2e/an (valeur max de la jauge)

function getScoreLevel(tons: number): {
  label: string
  color: string
  bgColor: string
  borderColor: string
  barColor: string
} {
  if (tons <= 5)
    return {
      label: 'Excellent',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      barColor: 'bg-emerald-500',
    }
  if (tons <= 10)
    return {
      label: 'Bien',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      barColor: 'bg-green-500',
    }
  if (tons <= 14)
    return {
      label: 'À améliorer',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      barColor: 'bg-amber-500',
    }
  return {
    label: 'Élevé',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    barColor: 'bg-red-500',
  }
}

export default function CarbonScoreCard() {
  const { data: scoreHistory, isLoading } = useScoreHistory()

  if (isLoading) {
    return <div className="h-[220px] w-full rounded-2xl bg-gray-200 animate-pulse" />
  }

  const latestScore = scoreHistory?.[0]

  if (!latestScore) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800">
          <Leaf className="h-5 w-5 text-emerald-600" aria-hidden />
          Mon score carbone
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Vous n'avez pas encore calculé votre empreinte carbone.
        </p>
        <Button
          className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
          size="lg"
        >
          Calculer mon empreinte
        </Button>
      </div>
    )
  }

  const scoreInTons = latestScore.score / 1000
  const scoreDisplay = scoreInTons.toFixed(1)
  const isAboveAverage = scoreInTons > FRENCH_AVERAGE
  const diffFromAverage = Math.abs(scoreInTons - FRENCH_AVERAGE).toFixed(1)
  const level = getScoreLevel(scoreInTons)
  const gaugePercent = Math.min((scoreInTons / MAX_GAUGE) * 100, 100)
  const averagePercent = (FRENCH_AVERAGE / MAX_GAUGE) * 100

  return (
    <div className={`overflow-hidden rounded-2xl border p-5 shadow-sm ${level.bgColor} ${level.borderColor}`}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-gray-800">
          <Leaf className="h-5 w-5 text-emerald-600" aria-hidden />
          Mon score carbone
        </h3>
        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${level.color} bg-white/70`}>
          {level.label}
        </span>
      </div>

      {/* Score principal */}
      <div className="mb-4 flex items-end gap-3">
        <div>
          <span className={`text-4xl font-extrabold leading-none ${level.color}`}>
            {scoreDisplay}
          </span>
          <span className="ml-1 text-lg font-semibold text-gray-500">t</span>
          <span className="ml-1 text-sm text-gray-400">CO₂e/an</span>
        </div>
        <div className={`mb-1 flex items-center gap-1 text-sm font-medium ${level.color}`}>
          {isAboveAverage ? (
            <TrendingUp className="h-4 w-4" aria-hidden />
          ) : (
            <TrendingDown className="h-4 w-4" aria-hidden />
          )}
          <span>
            {isAboveAverage ? '+' : '-'}{diffFromAverage}t vs moyenne
          </span>
        </div>
      </div>

      {/* Jauge */}
      <div className="mb-1">
        <div className="relative h-3 w-full rounded-full bg-white/60">
          {/* Barre du score */}
          <div
            className={`absolute left-0 top-0 h-3 rounded-full transition-all duration-500 ${level.barColor}`}
            style={{ width: `${gaugePercent}%` }}
          />
          {/* Marqueur moyenne française */}
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${averagePercent}%` }}
          >
            <div className="h-5 w-0.5 rounded-full bg-gray-500/60" />
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400">
          <span>0t</span>
          <span
            className="relative -translate-x-1/2"
            style={{ marginLeft: `${averagePercent}%` }}
          >
            Moy. FR {FRENCH_AVERAGE}t
          </span>
          <span>{MAX_GAUGE}t</span>
        </div>
      </div>

      {/* Message contextuel */}
      <p className="mb-4 mt-3 text-sm text-gray-600">
        {isAboveAverage
          ? `Votre empreinte est supérieure à la moyenne française. Découvrez comment la réduire.`
          : `Bravo ! Votre empreinte est inférieure à la moyenne française. Continuez sur cette lancée !`}
      </p>

      <Button
        className="w-full bg-emerald-700 text-white hover:bg-emerald-800"
        size="lg"
      >
        Voir nos recommandations
      </Button>
    </div>
  )
}
