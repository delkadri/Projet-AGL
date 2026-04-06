import { useState } from 'react'
import { Beef, Bike, Leaf, Recycle, Sparkles, type LucideIcon } from 'lucide-react'

import { ChallengeDetailDialog } from '@/components/challenges/ChallengeDetailDialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ChallengeIconKey, CommunityActiveDefiDto } from '@/types/community'

import { CommunityBonusLeavesBurst } from './CommunityBonusLeavesBurst'

const DEFI_ICONS: Record<ChallengeIconKey, { Icon: LucideIcon; bg: string }> = {
  beef: { Icon: Beef, bg: 'bg-red-500' },
  bike: { Icon: Bike, bg: 'bg-sky-600' },
  recycle: { Icon: Recycle, bg: 'bg-emerald-600' },
  leaf: { Icon: Leaf, bg: 'bg-[#2e7d32]' },
}

function formatEndDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

type CommunityChallengeBannerProps = {
  defi: CommunityActiveDefiDto
  membersCompleted: number
  currentUserCompleted: boolean
  onMarkComplete: () => void
  showBonusBurst: boolean
  compact?: boolean
  mini?: boolean
  className?: string
}

export function CommunityChallengeBanner({
  defi,
  membersCompleted,
  currentUserCompleted,
  onMarkComplete,
  showBonusBurst,
  className,
}: CommunityChallengeBannerProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const total = Math.max(1, defi.members_total_for_challenge)
  const pct = Math.min(100, Math.round((membersCompleted / total) * 100))
  const { Icon: DefiIcon, bg } = DEFI_ICONS[defi.iconKey]
  const isComplete = membersCompleted >= total

  return (
    <>
      <section
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-[#43a047] bg-linear-to-br from-[#e8f5e9] via-[#c8e6c9]/80 to-[#a5d6a7]/90',
          'text-[#1b5e20] shadow-[0_4px_16px_-4px_rgba(27,94,32,0.35)] ring-1 ring-white/80',
          'p-2.5',
          className,
        )}
        aria-labelledby="community-defi-title"
      >
        <CommunityBonusLeavesBurst active={showBonusBurst} className="rounded-xl" />

        <style>{`
          @keyframes community-bonus-dash-orbit {
            to {
              stroke-dashoffset: -18;
            }
          }
          .community-bonus-dash-rect {
            animation: community-bonus-dash-orbit 2.2s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .community-bonus-dash-rect {
              animation: none;
            }
          }
        `}</style>

        {/* Row 1 — icône + titre + bonus pill */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Voir le détail du défi communautaire"
          className="relative z-10 flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-[#1b5e20]/8 focus-visible:ring-2 focus-visible:ring-[#1b5e20] focus-visible:ring-offset-2 focus-visible:outline-none"
          onClick={() => setDetailOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setDetailOpen(true)
            }
          }}
        >
          {/* Icône du défi */}
          <div
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-xl text-white shadow ring-2 ring-white/90',
              bg,
            )}
          >
            <DefiIcon className="size-4" aria-hidden />
          </div>

          {/* Titre + méta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#1b5e20] px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                <Sparkles className="size-2.5" aria-hidden />
                Défi
              </span>
              {isComplete && (
                <span className="rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-bold text-amber-900 ring-1 ring-amber-300/80">
                  Objectif atteint
                </span>
              )}
            </div>
            <h2
              id="community-defi-title"
              className="mt-0.5 line-clamp-1 text-sm font-extrabold leading-tight tracking-tight text-[#1b2e1b]"
            >
              {defi.title}
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-[#33691e]">
              Avant le {formatEndDate(defi.ends_at)}
              <span className="mx-1 opacity-50" aria-hidden>·</span>
              <span className="underline decoration-[#43a047]/60 underline-offset-2">Détails</span>
            </p>
          </div>

          {/* Bonus pill — pointillés animés le long du contour (SVG) */}
          <div
            className="relative isolate shrink-0 rounded-xl p-[2px]"
            aria-label={`Bonus collectif : +${defi.bonus_feuilles} feuilles par personne si 100% de l'équipe`}
          >
            <svg
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
              aria-hidden
            >
              <rect
                className="community-bonus-dash-rect"
                x="1.5"
                y="1.5"
                width="97"
                height="97"
                rx="11"
                ry="11"
                stroke="#2e7d32"
                strokeOpacity="0.65"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 rounded-[10px] bg-white/90 px-2 py-1.5">
              <span className="text-[9px] font-bold uppercase leading-none tracking-wide text-[#33691e]">
                Bonus collectif
              </span>
              <span className="inline-flex items-center gap-1 text-lg font-black tabular-nums leading-none text-[#1b5e20]">
                +{defi.bonus_feuilles}
                <Leaf className="size-4 text-[#43a047]" aria-hidden />
              </span>
              <span className="text-[9px] font-medium leading-none text-[#33691e]">par personne</span>
            </div>
          </div>
        </div>

        {/* Row 2 — barre de progression */}
        <div className="relative z-10 mt-2.5 px-1">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px] font-bold tabular-nums text-[#1b5e20]">
            <span>Équipe : {membersCompleted}/{total}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1b5e20]/20 shadow-inner">
            <div
              className={cn(
                'h-full rounded-full bg-linear-to-r from-[#2e7d32] via-[#43a047] to-[#66bb6a] shadow-sm transition-[width] duration-500 ease-out',
                isComplete && 'from-[#1b5e20] to-[#2e7d32]',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Row 3 — bouton */}
        <div className="relative z-10 mt-2 px-1">
          <Button
            type="button"
            size="sm"
            variant={currentUserCompleted ? 'outline' : 'default'}
            className={cn(
              'h-8 w-full text-xs font-bold shadow-sm',
              currentUserCompleted
                ? 'border-[#1b5e20]/40 bg-white/80 text-[#1b5e20] hover:bg-[#e8f5e9] disabled:opacity-100'
                : 'bg-[#1b5e20] text-white hover:bg-[#2e7d32]',
            )}
            disabled={currentUserCompleted}
            onClick={(e) => {
              e.stopPropagation()
              onMarkComplete()
            }}
          >
            {currentUserCompleted ? 'Défi relevé ✓' : "J'ai relevé le défi"}
          </Button>
        </div>
      </section>

      <ChallengeDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        challenge={defi}
        dialogTitle="Défi communautaire"
        footer={
          <Button
            type="button"
            className="w-full bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
            onClick={() => setDetailOpen(false)}
          >
            Fermer
          </Button>
        }
      />
    </>
  )
}
