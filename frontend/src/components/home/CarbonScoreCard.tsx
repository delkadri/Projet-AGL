import { Button } from '@/components/ui/button'
import { Gauge } from 'lucide-react'

// TODO: Remplacer par les données de l'API carbone quand disponible
const MOCK_CARBON = {
  value: 8.5,
  unit: 't Co2e/an',
  feedback: 'Supérieur à la moyenne. Continuez vos efforts !',
} as const

export default function CarbonScoreCard() {
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
              {MOCK_CARBON.value}
            </span>
            <span className="ml-0.5 text-sm font-normal">t</span>
            <br />
            <span className="text-xs font-normal">
              Co2e/an
            </span>
          </span>
        </div>
        <p className="flex-1 text-sm font-medium text-white sm:text-base">
          {MOCK_CARBON.feedback}
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
