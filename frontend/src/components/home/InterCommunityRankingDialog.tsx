import { Flame, Leaf, Loader2, Trophy } from 'lucide-react'

import { useInterCommunityLeaderboard } from '@/api/hooks/useInterCommunityLeaderboard'
import { useUserCommunities } from '@/api/hooks/useUserCommunities'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CommunityWinStreakStatus, InterCommunityLeaderboardEntryDto } from '@/types/community'

function formatCarbonAvg(tco2ePerYear: number) {
  return `${tco2ePerYear.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t CO2e/an`
}

const STREAK_STATUS_LABEL: Record<CommunityWinStreakStatus, string> = {
  active: 'Série active',
  at_risk: 'Série fragile',
  broken: 'Série en pause',
}

function streakBadgeClass(status: CommunityWinStreakStatus) {
  switch (status) {
    case 'active':
      return 'bg-[#1b5e20]/10 text-[#1b5e20] ring-[#1b5e20]/20'
    case 'at_risk':
      return 'bg-amber-50 text-amber-900 ring-amber-200'
    case 'broken':
      return 'bg-muted text-muted-foreground ring-border'
  }
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-amber-600 text-sm font-bold text-amber-950 shadow-sm"
        aria-hidden
      >
        <Trophy className="size-4" strokeWidth={2.2} />
      </span>
    )
  }
  if (rank === 2) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-slate-200 to-slate-400 text-sm font-bold text-slate-800 shadow-sm"
        aria-hidden
      >
        2
      </span>
    )
  }
  if (rank === 3) {
    return (
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-orange-200 to-orange-400 text-sm font-bold text-orange-950 shadow-sm"
        aria-hidden
      >
        3
      </span>
    )
  }
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-[#1b5e20] shadow-sm ring-1 ring-[#1b5e20]/15"
      aria-hidden
    >
      {rank}
    </span>
  )
}

function LeaderboardRow({
  entry,
  isMember,
}: {
  entry: InterCommunityLeaderboardEntryDto
  isMember: boolean
}) {
  const { rank, community, average_carbon_tco2e_per_year, win_streak } = entry

  return (
    <li
      className={cn(
        'rounded-xl border p-3 shadow-sm transition-colors',
        isMember
          ? 'border-[#1b5e20]/50 bg-[#e8f5e9]/90 ring-1 ring-[#1b5e20]/20'
          : 'border-[#1b5e20]/12 bg-white/90',
      )}
    >
      <div className="flex items-start gap-3">
        <RankMedal rank={rank} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-gray-900">{community.name}</p>
            {isMember && (
              <span className="shrink-0 rounded-full bg-[#1b5e20] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Votre équipe
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {community.member_count} membre{community.member_count > 1 ? 's' : ''}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[#1b5e20]">
              <Leaf className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="font-medium">{formatCarbonAvg(average_carbon_tco2e_per_year)}</span>
              <span className="sr-only">Score carbone moyen</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-gray-800">
                <Flame
                  className={cn(
                    'size-3.5 shrink-0',
                    win_streak.count > 0 ? 'text-orange-500' : 'text-gray-400',
                  )}
                  aria-hidden
                />
                <span className="font-medium tabular-nums">
                  {win_streak.count === 0
                    ? 'Aucune victoire consécutive'
                    : `${win_streak.count} victoire${win_streak.count > 1 ? 's' : ''} consécutive${win_streak.count > 1 ? 's' : ''}`}
                </span>
              </div>
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1',
                  streakBadgeClass(win_streak.status),
                )}
              >
                {STREAK_STATUS_LABEL[win_streak.status]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

type InterCommunityRankingDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InterCommunityRankingDialog({ open, onOpenChange }: InterCommunityRankingDialogProps) {
  const { data: leaderboard, isPending, isError } = useInterCommunityLeaderboard()
  const { data: memberships } = useUserCommunities()

  const memberIds = new Set(memberships?.map((m) => m.community.id) ?? [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(90vh,640px)] gap-0 overflow-hidden border-[#1b5e20]/20 bg-[#f1f8e9] p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[#1b5e20]/10 bg-[#c8e6c9]/50 px-5 py-4 text-left">
          <DialogTitle className="text-lg font-bold text-[#1b5e20]">
            Classement inter-communautés
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-700">
            Empreinte carbone moyenne des membres et série de défis réussis ensemble (données
            d’exemple).
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] overflow-y-auto px-4 py-4">
          {isPending && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-[#1b5e20]">
              <Loader2 className="size-8 animate-spin opacity-70" aria-hidden />
              <p className="text-sm font-medium">Chargement du classement…</p>
            </div>
          )}

          {isError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Impossible de charger le classement pour le moment.
            </p>
          )}

          {!isPending && !isError && leaderboard && leaderboard.length > 0 && (
            <ul className="flex flex-col gap-2.5" aria-label="Classement des communautés">
              {leaderboard.map((entry) => (
                <LeaderboardRow
                  key={entry.community.id}
                  entry={entry}
                  isMember={memberIds.has(entry.community.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#1b5e20]/10 bg-white/60 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="w-full border-[#1b5e20]/35 text-[#1b5e20] hover:bg-[#e8f5e9]"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
