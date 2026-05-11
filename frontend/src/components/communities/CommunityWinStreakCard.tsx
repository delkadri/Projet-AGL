import { Flame, ShieldAlert, Snowflake } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { CommunityWinStreakDto } from '@/types/community'

/** Pastille une ligne pour la barre du haut (nom + streak + classement). */
export function CommunityWinStreakInline({ streak }: { streak: CommunityWinStreakDto }) {
  const { count, status } = streak
  const Icon =
    status === 'active' ? Flame : status === 'at_risk' ? ShieldAlert : Snowflake
  const title =
    status === 'active'
      ? `Série active : ${count} victoire(s) collective(s) d’affilée quand tout le monde valide le défi à temps.`
      : status === 'at_risk'
        ? `Série en danger : ${count} — terminez le défi avant la date limite pour ne pas repartir à zéro.`
        : `Série en pause. Réussissez un défi à 100 % pour relancer.`

  return (
    <div
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-xs font-bold tabular-nums shadow-sm',
        status === 'active' &&
          'border-orange-200 bg-linear-to-r from-amber-50 to-orange-50 text-orange-900',
        status === 'at_risk' &&
          'border-amber-300 bg-amber-50 text-amber-950',
        status === 'broken' && 'border-gray-200 bg-gray-100 text-gray-700',
      )}
      title={title}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{count}</span>
      <span className="hidden font-semibold sm:inline">win</span>
    </div>
  )
}

type CommunityWinStreakCardProps = {
  streak: CommunityWinStreakDto
}

export function CommunityWinStreakCard({ streak }: CommunityWinStreakCardProps) {
  const { count, status } = streak

  const meta =
    status === 'active'
      ? {
          Icon: Flame,
          border: 'border-emerald-300',
          bg: 'bg-linear-to-br from-amber-50 to-orange-50',
          title: 'Série de victoires',
          body: `Chaque fois que tous les membres relèvent le défi avant la date limite, la série augmente (+1).`,
        }
      : status === 'at_risk'
        ? {
            Icon: ShieldAlert,
            border: 'border-amber-400',
            bg: 'bg-amber-50/90',
            title: 'Série en danger',
            body: `La fenêtre du défi se termine bientôt. Si tout le monde ne valide pas à temps, la série repart à zéro.`,
          }
        : {
            Icon: Snowflake,
            border: 'border-gray-300',
            bg: 'bg-gray-50',
            title: 'Série en pause',
            body: `Réussissez un défi communautaire à 100 % avant la fin de la semaine pour relancer votre win streak.`,
          }

  const Icon = meta.Icon

  return (
    <section
      className={cn(
        'rounded-2xl border-2 p-4 shadow-sm',
        meta.border,
        meta.bg,
      )}
      aria-labelledby="win-streak-title"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl',
            status === 'active' && 'bg-orange-500 text-white',
            status === 'at_risk' && 'bg-amber-500 text-white',
            status === 'broken' && 'bg-gray-400 text-white',
          )}
        >
          <Icon className="size-6" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p id="win-streak-title" className="text-xs font-bold tracking-wide text-gray-600 uppercase">
            {meta.title}
          </p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-black tabular-nums text-[#1b5e20]">{count}</span>
            <span className="text-sm font-medium text-gray-700">
              victoire{count > 1 ? 's' : ''} collective{count > 1 ? 's' : ''} d&apos;affilée
            </span>
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-600">{meta.body}</p>
        </div>
      </div>
    </section>
  )
}
