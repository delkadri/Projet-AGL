import { Button } from '@/components/ui/button'
import { Beef } from 'lucide-react'

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
      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-[#1b5e20]">
        Défis
      </h3>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#a5d6a7]">
        <div className="h-full w-1/3 rounded-full bg-[#2e7d32]" />
      </div>
      <p className="mb-3 text-xs text-[#1b5e20]">{MOCK_CHALLENGE.weekProgress}</p>
      <div className="mb-4 flex gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
          <Beef className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold text-[#1b5e20]">
            {MOCK_CHALLENGE.title}
          </p>
          <p className="text-sm text-gray-700">
            {MOCK_CHALLENGE.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button
          className="bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
          size="sm"
        >
          J'ai relevé le défi
        </Button>
        <span className="rounded-full border border-[#2e7d32] bg-[#e8f5e9] px-3 py-1 text-sm font-medium text-[#1b5e20]">
          {MOCK_CHALLENGE.points} 🌿
        </span>
      </div>
    </div>
  )
}
