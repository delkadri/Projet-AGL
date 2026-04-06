import { Beef, Bike, Leaf, Recycle, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ChallengeIconKey, ChallengePresentationDto } from '@/types/community'

const ICON_CONFIG: Record<
  ChallengeIconKey,
  { Icon: LucideIcon; circleClass: string }
> = {
  beef: { Icon: Beef, circleClass: 'bg-red-500' },
  bike: { Icon: Bike, circleClass: 'bg-sky-600' },
  recycle: { Icon: Recycle, circleClass: 'bg-emerald-600' },
  leaf: { Icon: Leaf, circleClass: 'bg-green-600' },
}

type ChallengeDetailContentProps = {
  challenge: ChallengePresentationDto
  className?: string
  /** Texte points : défaut 🌿 comme la carte Accueil. */
  pointsSuffix?: string
}

export function ChallengeDetailContent({
  challenge,
  className,
  pointsSuffix = '🌿',
}: ChallengeDetailContentProps) {
  const { Icon, circleClass } = ICON_CONFIG[challenge.iconKey]

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white',
          circleClass,
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <p className="text-base font-bold text-[#1b5e20] uppercase">{challenge.title}</p>
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#2e7d32] bg-[#e8f5e9] px-3 py-1 text-sm font-medium text-[#1b5e20]">
            <span>{challenge.points}</span>
            <span aria-hidden>{pointsSuffix}</span>
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#1b5e20]">{challenge.description}</p>
      </div>
    </div>
  )
}
