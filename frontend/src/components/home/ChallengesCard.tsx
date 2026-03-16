import { Button } from '@/components/ui/button'
import { Beef, Target } from 'lucide-react'

// TODO: Remplacer par les données défis de l'API quand disponible
const MOCK_CHALLENGE = {
  weekProgress: '1/3 défis cette semaine',
  title: 'JOURNÉE SANS VIANDE',
  description:
    'Éviter la viande aujourd\'hui pour réduire votre impact.',
  points: 150,
} as const

export default function ChallengesCard() {
  return (
    <div className="rounded-2xl bg-[#c8e6c9] p-4 shadow-md">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1b5e20]">
        <Target className="h-4 w-4" aria-hidden />
        Défis
      </h3>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#a5d6a7]">
        <div className="h-full w-1/3 rounded-full bg-[#2e7d32]" />
      </div>
      <p className="mb-3 text-xs text-[#1b5e20]">{MOCK_CHALLENGE.weekProgress}</p>
      <div className="rounded-2xl bg-[#a5d6a7] p-3">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
            <Beef className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-base font-bold uppercase text-[#1b5e20]">
                {MOCK_CHALLENGE.title}
              </p>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#2e7d32] bg-[#e8f5e9] px-3 py-1 text-sm font-medium text-[#1b5e20]">
                <span>{MOCK_CHALLENGE.points}</span>
                <span>🌿</span>
              </span>
            </div>
            <p className="text-sm text-[#1b5e20]">
              {MOCK_CHALLENGE.description}
            </p>
          </div>
        </div>
        <Button
          className="mt-1 w-full bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
          size="sm"
        >
          J'ai relevé le défi
        </Button>
      </div>
    </div>
  )
}
