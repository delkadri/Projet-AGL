import { Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getMockInterCommunityLeaderboardEntry } from '@/data/mockCommunities'

/** Communauté « maison » sur l’accueil (mock) — alignée sur `MOCK_USER_COMMUNITIES` / classement. */
const HOME_MOCK_COMMUNITY_SLUG = 'les-verts'

export default function CommunityCard() {
  const myEntry = getMockInterCommunityLeaderboardEntry(HOME_MOCK_COMMUNITY_SLUG)

  const teamName = myEntry?.community.name ?? 'Les Verts'
  const teamAverage = myEntry
    ? `${myEntry.average_carbon_tco2e_per_year.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t CO2e/an`
    : '—'

  return (
    <div className="rounded-2xl bg-[#c8e6c9] p-4 shadow-md">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[#1b5e20]">
        <Users className="h-4 w-4" />
        Communauté
      </h3>
      <p className="mb-1 text-sm font-medium text-[#1b5e20]">
        Score carbone moyen de l'équipe : {teamAverage}
      </p>
      <p className="mb-4 text-sm text-gray-700">
        {myEntry ? (
          <>
            Votre équipe &quot;{teamName}&quot; est{' '}
            <span className="font-semibold text-[#1b5e20]">
              {myEntry.rank === 1 ? '1re' : `${myEntry.rank}e`}
            </span>{' '}
            du classement inter-communautés.
          </>
        ) : (
          <>Rejoignez une communauté pour apparaître au classement.</>
        )}
      </p>
      <Button
        type="button"
        className="w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
        size="default"
      >
        Discuter avec votre groupe
      </Button>
    </div>
  )
}
