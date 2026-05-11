import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

const MONTH_SHORT_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const
const MONTH_ARIA_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
] as const

/** Repère discret : moyenne nationale ADEME ≈ 10 t CO₂e/an. */
const NATIONAL_AVG_T = 10
/** Objectif Accord de Paris (visuel pédagogique). */
const TARGET_2030_T = 7.1

export type AnnualScoreChartProps = {
  /** 12 valeurs en tonnes CO₂e/an, indexées de janvier (0) à décembre (11). 0 = aucun bilan. */
  valuesByMonth: ReadonlyArray<number>
  /** Index 0–11 du mois courant pour mise en évidence. */
  currentMonthIndex?: number
  /** Année affichée en titre (par défaut année courante). */
  year?: number
  className?: string
}

/**
 * Mini bar chart 12 mois (Jan→Déc), animation `height` en stagger au montage.
 * Pure SVG, sans dépendance. Mobile-first.
 */
export function AnnualScoreChart({
  valuesByMonth,
  currentMonthIndex,
  year = new Date().getFullYear(),
  className,
}: AnnualScoreChartProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 40)
    return () => window.clearTimeout(t)
  }, [])

  const maxValue = Math.max(...valuesByMonth, NATIONAL_AVG_T, 1)
  const yScaleMax = maxValue * 1.12

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl bg-white p-4 shadow-[0_12px_40px_-16px_rgba(26,77,62,0.18)] ring-1 ring-[#1A4D3E]/8',
        className,
      )}
      aria-label={`Évolution mensuelle ${year}`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A4D3E]/70">
            Évolution
          </p>
          <h3 className="text-base font-bold leading-tight text-[#1b3d32]">
            Année {year}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 rounded-full bg-slate-400/70" aria-hidden />
            Moy. nat.
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-0.5 w-3 rounded-full bg-emerald-600/80" aria-hidden />
            Obj. 2030
          </span>
        </div>
      </div>

      <div className="relative h-36 w-full pr-1 sm:h-40">
        <div
          className="pointer-events-none absolute inset-x-0 z-0 border-t border-dashed border-slate-300/70"
          style={{ top: `${(1 - NATIONAL_AVG_T / yScaleMax) * 100}%` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 z-0 border-t border-dashed border-emerald-500/55"
          style={{ top: `${(1 - TARGET_2030_T / yScaleMax) * 100}%` }}
          aria-hidden
        />

        <div className="relative z-10 flex h-full w-full items-end gap-1 sm:gap-1.5">
          {valuesByMonth.map((value, i) => {
            const heightPct = mounted ? Math.max(0, (value / yScaleMax) * 100) : 0
            const isEmpty = value <= 0
            const isCurrent = currentMonthIndex === i
            const valueStr = value > 0 ? (value < 10 ? value.toFixed(1) : value.toFixed(0)) : '0'
            return (
              <div
                key={i}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
                title={`${MONTH_ARIA_LABELS[i]} : ${valueStr} t`}
              >
                <div
                  role="img"
                  aria-label={`${MONTH_ARIA_LABELS[i]} : ${valueStr} tonnes CO₂e par an`}
                  className={cn(
                    'w-full rounded-t-md transition-[height,background-color] ease-out',
                    'duration-700',
                    isEmpty
                      ? 'bg-slate-200/70'
                      : isCurrent
                        ? 'bg-linear-to-t from-[#1A4D3E] via-emerald-600 to-emerald-400 shadow-[0_-2px_8px_-2px_rgba(26,77,62,0.35)]'
                        : 'bg-linear-to-t from-emerald-600 via-emerald-500 to-emerald-400/90',
                  )}
                  style={{
                    height: `${heightPct}%`,
                    minHeight: isEmpty ? '2px' : '4px',
                    transitionDelay: `${i * 55}ms`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-1.5 flex w-full gap-1 sm:gap-1.5">
        {MONTH_SHORT_LABELS.map((label, i) => {
          const isCurrent = currentMonthIndex === i
          return (
            <div
              key={i}
              className={cn(
                'flex-1 text-center text-[10px] font-semibold tabular-nums transition-colors',
                isCurrent ? 'text-[#1A4D3E]' : 'text-slate-400',
              )}
              aria-hidden
            >
              {label}
            </div>
          )
        })}
      </div>
    </section>
  )
}
