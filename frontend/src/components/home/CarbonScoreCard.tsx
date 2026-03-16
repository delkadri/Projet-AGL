import { Button } from '@/components/ui/button'
import { Gauge } from 'lucide-react'
import { useScoreHistory } from '@/api/hooks/useScoreHistory'

export default function CarbonScoreCard() {
  const { data: scoreHistory, isLoading } = useScoreHistory()

  if (isLoading) {
    return <div className="h-[200px] w-full rounded-2xl bg-gray-200 animate-pulse" />
  }

  const latestScore = scoreHistory?.[0]
  
  if (!latestScore) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-md">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-800">
          <Gauge className="h-5 w-5" aria-hidden />
          Mon score carbone
        </h3>
        <p className="text-sm font-medium text-gray-600 mb-4">
          Vous n'avez pas encore calculé votre empreinte carbone.
        </p>
        <div className="flex justify-center">
          <Button
            className="w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32] sm:w-auto"
            size="lg"
          >
            Calculer mon empreinte
          </Button>
        </div>
      </div>
    )
  }

  const scoreInTons = (latestScore.score / 1000).toFixed(1)
  const isAboveAverage = latestScore.score > 10000 // Moyenne française ~10t
  const feedback = isAboveAverage
    ? 'Supérieur à la moyenne. Il y a de la marge de progression !'
    : 'Inférieur à la moyenne. Continuez vos efforts !'

  return (
    <div className="overflow-hidden rounded-2xl bg-[linear-gradient(to_right,#e53935,#ff9800,#8bc34a)] p-4 shadow-md">
      <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
        <Gauge className="h-5 w-5" aria-hidden />
        Mon score carbone
      </h3>
      <div className="flex flex-row items-center gap-4">
        <div className="flex shrink-0 items-center justify-center rounded-full bg-[#c62828] px-5 py-4 text-white shadow">
          <span className="text-center">
            <span className="text-2xl font-bold leading-tight">
              {scoreInTons}
            </span>
            <span className="ml-0.5 text-sm font-normal">t</span>
            <br />
            <span className="text-xs font-normal">
              Co2e/an
            </span>
          </span>
        </div>
        <p className="flex-1 text-sm font-medium text-white sm:text-base">
          {feedback}
        </p>
      </div>
      <div className="mt-4 flex justify-center">
        <Button
          className="w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32] sm:w-auto"
          size="lg"
        >
          Voir nos recommandations
        </Button>
      </div>
    </div>
  )
}
