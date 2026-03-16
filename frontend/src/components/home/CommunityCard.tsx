import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

// TODO: Remplacer par les données communauté de l'API quand disponible
const MOCK_COMMUNITY = {
  teamAverage: '6.4 t Co2e/an',
  teamName: 'Les Verts',
  rank: 'XXX',
} as const

export default function CommunityCard() {
  return (
    <div className="rounded-2xl bg-[#c8e6c9] p-4 shadow-md">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1b5e20]">
        <Users className="h-4 w-4" />
        Communauté
      </h3>
      <p className="mb-1 text-sm font-medium text-[#1b5e20]">
        Score carbone moyen de l'équipe : {MOCK_COMMUNITY.teamAverage}
      </p>
      <p className="mb-4 text-sm text-gray-700">
        Votre équipe "{MOCK_COMMUNITY.teamName}" est {MOCK_COMMUNITY.rank} ème
      </p>
      <Button
        className="w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
        size="default"
      >
        Discuter avec votre groupe
      </Button>
    </div>
  )
}
