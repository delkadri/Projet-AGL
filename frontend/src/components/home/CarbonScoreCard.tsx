import { Link } from '@tanstack/react-router'
import { ChevronRight, Leaf, Loader2 } from 'lucide-react'

import { useCurrentUserQuery } from '@/api/hooks/useAuth'
import { useScoreHistory } from '@/api/hooks/useScoreHistory'
import { useOnboardingQuizResult } from '@/api/hooks/useOnboardingQuizResult'
import { getClimateLevelLabel, type QuizOnboardingBilan } from '@/components/quiz/QuizResult'
import { Button } from '@/components/ui/button'
import {
  getFootprintScoreTone,
  getFootprintScoreToneBadgeClass,
  getFootprintScoreToneGaugeGradient,
  getFootprintScoreToneTextClass,
} from '@/lib/footprint-score-tone'
import { cn } from '@/lib/utils'

const DONNEES_SCORE_CARBONE_PATH = '/donnees/bilan-onboarding' as const
const FRENCH_AVERAGE_KG = 10_000
const TARGET_2030_T = 7.1
/** Échelle max de la micro-jauge (t CO₂e/an), lecture rapide uniquement. */
const GAUGE_MAX_T = 20

function climateLevelFromTonnes(t: number): 'low' | 'medium' | 'high' {
  if (t <= 10) return 'low'
  if (t <= 14) return 'medium'
  return 'high'
}

function formatSavedShort(iso: string): string {
  try {
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const days = Math.floor(diffMs / 86_400_000)
    if (days <= 0) return "Aujourd'hui"
    if (days === 1) return 'Hier'
    if (days < 7) return `Il y a ${days} jours`
    if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(d)
  } catch {
    return ''
  }
}

function formatTonnesDisplay(t: number): string {
  return t < 10 ? t.toFixed(1) : t.toFixed(0)
}

export default function CarbonScoreCard() {
  const { isPending: authPending, data: authUser } = useCurrentUserQuery()
  const onboarding = useOnboardingQuizResult()
  const scoreHistoryQuery = useScoreHistory()
  const { data: scoreHistory } = scoreHistoryQuery

  const onboardingBilan = onboarding.data?.onboardingBilan as QuizOnboardingBilan | undefined
  const nationalTotalKg = onboardingBilan?.nationalTotalKgCo2ePerYear ?? FRENCH_AVERAGE_KG

  const authBootstrapping = authPending && authUser === undefined

  const scoreWaiting = scoreHistoryQuery.isEnabled && scoreHistoryQuery.isPending
  const onboardingWaiting = onboarding.isEnabled && onboarding.isPending

  const loading = authBootstrapping || scoreWaiting || onboardingWaiting

  if (loading) {
    return (
      <div
        className="flex min-h-[168px] flex-col items-center justify-center gap-3 rounded-3xl bg-linear-to-br from-white via-emerald-50/35 to-white p-6 shadow-[0_12px_40px_-16px_rgba(26,77,62,0.22)] ring-1 ring-[#1A4D3E]/10"
        role="status"
        aria-busy="true"
        aria-label="Chargement du score carbone"
      >
        <Loader2 className="size-8 shrink-0 animate-spin text-[#1A4D3E]" aria-hidden />
        <p className="text-center text-sm font-medium text-slate-600">Chargement du score carbone…</p>
      </div>
    )
  }

  const latestHistory = scoreHistory?.[0]
  const fromOnboarding = onboarding.data

  const totalKg = fromOnboarding
    ? fromOnboarding.score.totalKgCo2ePerYear
    : latestHistory
      ? latestHistory.score
      : null

  const climateLevel = fromOnboarding
    ? fromOnboarding.score.climateLevel
    : totalKg != null
      ? climateLevelFromTonnes(totalKg / 1000)
      : undefined

  const savedAtIso = fromOnboarding?.savedAt ?? latestHistory?.created_at ?? null
  const savedShort = savedAtIso ? formatSavedShort(savedAtIso) : null

  const cta = (
    <Button
      asChild
      size="lg"
      className="mt-4 h-12 w-full rounded-2xl border-0 bg-[#1A4D3E] text-[15px] font-semibold text-white shadow-md shadow-[#1A4D3E]/20 transition-[transform,background-color,box-shadow] hover:bg-[#153936] active:scale-[0.98]"
    >
      <Link to={DONNEES_SCORE_CARBONE_PATH} className="inline-flex w-full items-center justify-center gap-1 pr-0.5">
        Mon bilan détaillé
        <ChevronRight className="size-5 shrink-0 opacity-90" aria-hidden />
      </Link>
    </Button>
  )

  if (totalKg == null) {
    return (
      <article className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-emerald-50/35 to-white p-4 shadow-[0_12px_40px_-16px_rgba(26,77,62,0.22)] ring-1 ring-[#1A4D3E]/10">
        <div
          className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-emerald-400/20 blur-2xl"
          aria-hidden
        />
        <div className="relative flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1A4D3E] text-white shadow-inner shadow-black/10">
            <Leaf className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-base font-bold leading-tight tracking-tight text-[#1b3d32]">Score carbone</h2>
            <p className="mt-1.5 text-sm leading-snug text-slate-600">
              Consultez ou complétez votre bilan dans l’onglet Données.
            </p>
          </div>
        </div>
        {cta}
      </article>
    )
  }

  const totalT = totalKg / 1000
  const nationalT = nationalTotalKg / 1000
  const belowNational = totalT < nationalT - 0.05
  const aboveNational = totalT > nationalT + 0.05
  const diffAbs = Math.abs(totalT - nationalT)

  const gaugePct = Math.min(100, (totalT / GAUGE_MAX_T) * 100)
  const nationalPct = Math.min(100, (nationalT / GAUGE_MAX_T) * 100)
  const climateLabel = climateLevel != null ? getClimateLevelLabel(climateLevel) : '—'
  const tone = getFootprintScoreTone(totalT, nationalT, TARGET_2030_T)
  const target2030Pct = Math.min(100, (TARGET_2030_T / GAUGE_MAX_T) * 100)

  return (
    <article className="relative overflow-hidden rounded-3xl bg-linear-to-br from-white via-emerald-50/30 to-white p-4 shadow-[0_12px_40px_-16px_rgba(26,77,62,0.22)] ring-1 ring-[#1A4D3E]/10">
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-emerald-900/6 blur-2xl"
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1A4D3E] text-white shadow-sm">
            <Leaf className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1A4D3E]/80">Empreinte</p>
            <h2 className="truncate text-base font-bold leading-tight text-[#1b3d32]">Score carbone</h2>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1',
            getFootprintScoreToneBadgeClass(tone),
          )}
        >
          {climateLabel}
        </span>
      </div>

      <div className="relative mt-5 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span
          className={cn(
            'text-[2.75rem] font-black leading-none tracking-[-0.04em] tabular-nums',
            getFootprintScoreToneTextClass(tone),
          )}
        >
          {formatTonnesDisplay(totalT)}
        </span>
        <span className="pb-1 text-sm font-semibold text-slate-500">t CO₂e/an</span>
      </div>

      <p className="relative mt-2 text-sm leading-snug text-slate-600">
        {!belowNational && !aboveNational
          ? 'Proche de la moyenne nationale.'
          : belowNational
            ? `≈ ${formatTonnesDisplay(diffAbs)} t sous la moyenne nationale.`
            : `≈ ${formatTonnesDisplay(diffAbs)} t au-dessus de la moyenne nationale.`}
      </p>

      <div className="relative mt-4">
        <div
          className="relative h-5 w-full"
          role="img"
          aria-label={`Empreinte ${formatTonnesDisplay(totalT)} tonnes par an, repère moyenne nationale vers ${formatTonnesDisplay(nationalT)} tonnes.`}
        >
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200/90">
            <div
              className={cn('absolute inset-y-0 left-0 rounded-full bg-linear-to-r', getFootprintScoreToneGaugeGradient(tone))}
              style={{ width: `${gaugePct}%` }}
            />
          </div>
          <div
            className="pointer-events-none absolute top-1/2 z-[1] size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#1A4D3E]/50 bg-white shadow-sm"
            style={{ left: `${target2030Pct}%` }}
            title={`Objectif 2030 : ${TARGET_2030_T.toFixed(1).replace('.', ',')} t`}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-1/2 z-[1] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-500/55 bg-white shadow-sm"
            style={{ left: `${nationalPct}%` }}
            title={`Moyenne nationale ~ ${formatTonnesDisplay(nationalT)} t`}
            aria-hidden
          />
        </div>
        <div className="mt-1.5 flex justify-between gap-1 text-[10px] font-medium text-slate-400">
          <span className="shrink-0">0</span>
          <span className="min-w-0 truncate text-center text-slate-500" title={`7,1 t (objectif 2030) · ${formatTonnesDisplay(nationalT)} t (moyenne nationale)`}>
            7,1 t · {formatTonnesDisplay(nationalT)} t
          </span>
          <span className="shrink-0">{GAUGE_MAX_T} t</span>
        </div>
      </div>

      {savedShort ? (
        <p className="relative mt-3 text-xs font-medium text-slate-500">Mis à jour · {savedShort}</p>
      ) : null}

      {cta}
    </article>
  )
}
