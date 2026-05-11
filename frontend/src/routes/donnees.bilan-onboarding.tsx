import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronRight, Leaf, Minus, Sparkles } from 'lucide-react'

import type { ApiError, ScoreHistoryResponseDto } from '@/api/client'
import { useScoreHistory } from '@/api/hooks/useScoreHistory'
import { useOnboardingQuizResult } from '@/api/hooks/useOnboardingQuizResult'
import { getAuthErrorMessage } from '@/api/hooks/useAuth'
import { AnnualScoreChart } from '@/components/carbon/AnnualScoreChart'
import BottomNav from '@/components/home/BottomNav'
import { getClimateLevelLabel, type QuizOnboardingBilan } from '@/components/quiz/QuizResult'
import { Button } from '@/components/ui/button'
import {
  getFootprintScoreTone,
  getFootprintScoreToneAccentBlur,
  getFootprintScoreToneBadgeClass,
  getFootprintScoreToneTextClass,
  type FootprintScoreTone,
} from '@/lib/footprint-score-tone'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/donnees/bilan-onboarding')({
  component: DonneesScoreCarbonePage,
})

const COUNT_UP_DURATION_MS = 900
const FRENCH_AVERAGE_T = 10

function formatTonnesDisplay(t: number): string {
  if (!Number.isFinite(t)) return '0'
  return t < 10 ? t.toFixed(1) : t.toFixed(0)
}

function climateLevelFromTonnes(t: number): 'low' | 'medium' | 'high' {
  if (t <= 10) return 'low'
  if (t <= 14) return 'medium'
  return 'high'
}

function useCountUp(target: number, durationMs = COUNT_UP_DURATION_MS): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!Number.isFinite(target) || target <= 0) {
      setValue(0)
      return
    }
    let raf = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return value
}

/** Index 0–11 du mois (UTC) d'une date ISO. */
function getUtcMonthIndex(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return -1
  return d.getUTCMonth()
}

function getUtcYear(iso: string): number {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return -1
  return d.getUTCFullYear()
}

/** Pour chaque mois (0..11) de `year`, retourne la dernière entrée (la + récente) en tonnes/an, sinon 0. */
function buildAnnualValues(history: ScoreHistoryResponseDto[], year: number): number[] {
  const byMonth: Array<{ at: number; kg: number } | null> = Array(12).fill(null)
  for (const entry of history) {
    if (getUtcYear(entry.created_at) !== year) continue
    const m = getUtcMonthIndex(entry.created_at)
    if (m < 0 || m > 11) continue
    const at = new Date(entry.created_at).getTime()
    const prev = byMonth[m]
    if (!prev || at > prev.at) byMonth[m] = { at, kg: entry.score }
  }
  return byMonth.map((v) => (v ? v.kg / 1000 : 0))
}

function formatMonthYear(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return ''
  }
}

type DeltaInfo = {
  diffT: number
  direction: 'up' | 'down' | 'eq'
  tone: FootprintScoreTone
}

/** Comparaison vs entrée chronologique précédente (plus ancienne). Convention : ↓ = mieux. */
function computeDelta(currentKg: number, previousKg: number | null | undefined): DeltaInfo | null {
  if (previousKg == null) return null
  const diffT = (currentKg - previousKg) / 1000
  if (Math.abs(diffT) < 0.05) return { diffT: 0, direction: 'eq', tone: 'green' }
  const direction = diffT > 0 ? 'up' : 'down'
  const tone: FootprintScoreTone = direction === 'down' ? 'green' : 'red'
  return { diffT, direction, tone }
}

function DonneesScoreCarbonePage() {
  const navigate = useNavigate()
  const { data: scoreHistory, isLoading, isError, error, refetch } = useScoreHistory()
  const onboarding = useOnboardingQuizResult()

  const sortedDesc = useMemo(
    () =>
      (scoreHistory ?? [])
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [scoreHistory],
  )

  const latest = sortedDesc[0]
  const latestKg = latest?.score ?? 0
  const latestT = latestKg / 1000
  const countedT = useCountUp(latestT)

  const onboardingBilan = onboarding.data?.onboardingBilan as QuizOnboardingBilan | undefined
  const nationalKg = onboardingBilan?.nationalTotalKgCo2ePerYear
  const nationalT = nationalKg != null ? nationalKg / 1000 : FRENCH_AVERAGE_T

  const tone = getFootprintScoreTone(latestT, nationalT)
  const climateLevel = onboarding.data?.score.climateLevel ?? climateLevelFromTonnes(latestT)
  const climateLabel = getClimateLevelLabel(climateLevel)

  const currentYear = new Date().getFullYear()
  const annualValues = useMemo(
    () => buildAnnualValues(sortedDesc, currentYear),
    [sortedDesc, currentYear],
  )
  const currentMonthIndex = new Date().getUTCMonth()

  const historyOldestToNewest = useMemo(() => sortedDesc.slice().reverse(), [sortedDesc])
  const previousKgById = useMemo(() => {
    const m = new Map<string, number>()
    for (let i = 1; i < historyOldestToNewest.length; i++) {
      const cur = historyOldestToNewest[i]
      const prev = historyOldestToNewest[i - 1]
      if (cur && prev) m.set(cur.id, prev.score)
    }
    return m
  }, [historyOldestToNewest])
  const oldestId = historyOldestToNewest[0]?.id

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-[#f1f8e9] pb-24">
        <div className="mx-auto w-full max-w-md space-y-3 px-4 pt-3">
          <div className="h-44 animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#1A4D3E]/8" />
          <div className="h-52 animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#1A4D3E]/8" />
          <div className="h-64 animate-pulse rounded-3xl bg-white/70 ring-1 ring-[#1A4D3E]/8" />
        </div>
        <BottomNav />
      </div>
    )
  }

  if (isError) {
    const apiErr = error as ApiError | undefined
    const message =
      apiErr?.status === 404
        ? 'Aucun bilan enregistré pour l’instant.'
        : getAuthErrorMessage(error)
    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-[#f1f8e9] px-4 pb-24">
        <p className="max-w-sm text-center text-red-700">{message}</p>
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          Réessayer
        </Button>
        <BottomNav />
      </div>
    )
  }

  if (!latest) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-4 overflow-y-auto bg-[#f1f8e9] px-4 pb-24">
        <article className="max-w-sm rounded-3xl bg-white p-5 text-center shadow-sm ring-1 ring-[#1A4D3E]/10">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-[#1A4D3E] text-white">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <h2 className="text-base font-bold text-[#1b3d32]">Aucun bilan pour l’instant</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Commencez par compléter votre bilan d’onboarding ou le quiz du mois pour suivre votre score
            sur l’année.
          </p>
          <Button asChild className="mt-4 h-11 w-full rounded-2xl bg-[#1A4D3E] text-white hover:bg-[#153936]">
            <Link to="/donnees">Aller au quiz du mois</Link>
          </Button>
        </article>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-[#f1f8e9] pb-24">
      <div className="mx-auto w-full max-w-md space-y-3 px-4 pt-3 sm:pt-4">
        {/* Bloc A — Score moyen sur l'année (hero) */}
        <section
          className="relative animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-3xl bg-white p-4 shadow-[0_14px_44px_-18px_rgba(26,77,62,0.32)] ring-1 ring-[#1A4D3E]/10 duration-500"
          aria-label="Score carbone moyen sur l'année"
        >
          <div
            className={cn(
              'pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-linear-to-br opacity-25 blur-2xl',
              getFootprintScoreToneAccentBlur(tone),
            )}
            aria-hidden
          />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#1A4D3E] text-white shadow-sm">
                <Leaf className="size-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A4D3E]/75">
                  Score moyen sur l’année
                </p>
                <h1 className="truncate text-base font-bold leading-tight text-[#1b3d32]">
                  Mon score carbone
                </h1>
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
                'text-[3rem] font-black leading-none tracking-[-0.04em] tabular-nums',
                getFootprintScoreToneTextClass(tone),
              )}
            >
              {formatTonnesDisplay(countedT)}
            </span>
            <span className="pb-1 text-sm font-semibold text-slate-500">t CO₂e/an</span>
          </div>

          <p className="relative mt-2 text-sm leading-snug text-slate-600">
            Mis à jour le{' '}
            <span className="font-semibold text-[#1b3d32]">
              {new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(latest.created_at))}
            </span>
            .
          </p>
        </section>

        {/* Bloc B — Évolution Jan→Déc */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:80ms]">
          <AnnualScoreChart
            valuesByMonth={annualValues}
            currentMonthIndex={currentMonthIndex}
            year={currentYear}
          />
        </div>

        {/* Bloc C — Historique cliquable */}
        <section
          className="animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-3xl bg-white shadow-[0_12px_40px_-16px_rgba(26,77,62,0.18)] ring-1 ring-[#1A4D3E]/8 duration-500 [animation-delay:160ms]"
          aria-label="Historique des bilans"
        >
          <div className="flex items-baseline justify-between px-4 pt-4 pb-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A4D3E]/70">
                Historique
              </p>
              <h3 className="text-base font-bold leading-tight text-[#1b3d32]">Mes bilans</h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {sortedDesc.length} {sortedDesc.length > 1 ? 'bilans' : 'bilan'}
            </span>
          </div>

          <ul role="list" className="divide-y divide-slate-100">
            {sortedDesc.map((entry, i) => {
              const t = entry.score / 1000
              const monthLabel = formatMonthYear(entry.created_at)
              const isOnboarding = entry.id === oldestId
              const delta = computeDelta(entry.score, previousKgById.get(entry.id))
              const deltaToneClass =
                delta?.tone === 'red' ? 'text-red-600' : delta?.tone === 'green' ? 'text-emerald-700' : 'text-slate-500'

              return (
                <li
                  key={entry.id}
                  className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300 fill-mode-backwards"
                  style={{ animationDelay: `${200 + i * 45}ms` }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      void navigate({ to: '/donnees/score/$id', params: { id: entry.id } })
                    }
                    aria-label={`Voir le détail du bilan ${monthLabel}`}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-[background-color,transform]',
                      'hover:bg-emerald-50/60 active:scale-[0.99] active:bg-emerald-50',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A4D3E]/40',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold capitalize text-[#1b3d32]">
                          {monthLabel}
                        </p>
                        {isOnboarding ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 ring-1 ring-amber-300/60">
                            Bilan initial
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {new Intl.DateTimeFormat('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(entry.created_at))}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-sm font-bold tabular-nums text-[#1b3d32]">
                        {formatTonnesDisplay(t)} <span className="text-[11px] font-semibold text-slate-500">t/an</span>
                      </span>
                      {delta ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums',
                            deltaToneClass,
                          )}
                          aria-label={
                            delta.direction === 'eq'
                              ? 'Stable par rapport au bilan précédent'
                              : delta.direction === 'down'
                                ? `En baisse de ${Math.abs(delta.diffT).toFixed(1)} tonnes`
                                : `En hausse de ${Math.abs(delta.diffT).toFixed(1)} tonnes`
                          }
                        >
                          {delta.direction === 'eq' ? (
                            <Minus className="size-3" aria-hidden />
                          ) : delta.direction === 'down' ? (
                            <ArrowDownRight className="size-3" aria-hidden />
                          ) : (
                            <ArrowUpRight className="size-3" aria-hidden />
                          )}
                          {delta.direction === 'eq'
                            ? 'stable'
                            : `${Math.abs(delta.diffT).toFixed(1)} t`}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">—</span>
                      )}
                    </div>

                    <ChevronRight
                      className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
      <BottomNav />
    </div>
  )
}
