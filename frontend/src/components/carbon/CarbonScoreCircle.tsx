import {
  getFootprintScoreTone,
  getFootprintScoreToneAccentBlur,
  getFootprintScoreToneBadgeClass,
  getFootprintScoreToneGaugeGradient,
  getFootprintScoreToneMarkerClass,
  getFootprintScoreToneTextClass,
} from '@/lib/footprint-score-tone'
import { cn } from '@/lib/utils'
import { Activity, Leaf, Target, TrendingDown, TrendingUp } from 'lucide-react'

interface CarbonScoreCircleProps {
  score: number
  climateLevel?: string
  message?: string
  /** Si false, masque le sous-texte « Voici les détails » (bilan onboarding). */
  showDetailsHint?: boolean
  /** Moyenne nationale en kg CO₂e/an, utilisée pour le comparatif dashboard. */
  nationalAverageKg?: number
  /** Si false, masque le bloc « À réduire / Moy. nationale » (aperçu accueil, etc.). */
  showComparisonsGrid?: boolean
  /** Marges et jauge un peu plus serrées (écran onboarding mobile). */
  density?: 'default' | 'compact'
  /** Halo décoratif en haut à droite (désactivé sur recap onboarding : overflow + tons rouges). */
  showDecorativeAccent?: boolean
}

function formatTonnes(value: number): string {
  return value < 10 ? value.toFixed(1) : value.toFixed(0)
}

const TOP_BUBBLE_ROW_PX = 28
const TOP_BUBBLE_APPROX_H = 8
/** Écart horizontal minimal (en % de la largeur) pour empiler deux bulles sur deux rangées. */
const TOP_BUBBLE_MIN_H_GAP_PCT = 10

type TopAnnotationLayout = {
  target: { leftPct: number; row: number }
  national: { leftPct: number; row: number } | null
  maxRow: number
  topZoneMinHeightPx: number
  bubbleRowPx: number
  bubbleApproxH: number
}

/**
 * Rangées dynamiques : bulles alignées sur les % réels de l’échelle (comme les traits sur la barre).
 * Si deux bulles sont trop proches horizontalement, la seconde (plus à droite sur l’échelle) passe en rangée inférieure.
 */
function layoutTopAnnotations(
  targetPct: number,
  nationalPct: number | null,
  bubbleRowPx: number,
  bubbleApproxH: number,
): TopAnnotationLayout {
  const items: Array<{ id: 'target' | 'national'; pct: number }> = [{ id: 'target', pct: targetPct }]
  if (nationalPct != null) items.push({ id: 'national', pct: nationalPct })
  const sorted = [...items].sort((a, b) => a.pct - b.pct)
  const placed: Array<{ id: 'target' | 'national'; pct: number; row: number }> = []
  for (const item of sorted) {
    let row = 0
    while (
      placed.some(
        (p) => p.row === row && Math.abs(p.pct - item.pct) < TOP_BUBBLE_MIN_H_GAP_PCT,
      )
    ) {
      row += 1
      if (row > 6) break
    }
    placed.push({ ...item, row })
  }
  const targetPlaced = placed.find((p) => p.id === 'target')!
  const nationalPlaced = placed.find((p) => p.id === 'national')
  const targetRow = targetPlaced.row
  /** La bulle moy. nat. doit toujours être plus basse que Objectif 2030. */
  const nationalLayout =
    nationalPlaced != null
      ? {
        leftPct: nationalPlaced.pct,
        row: Math.max(nationalPlaced.row, targetRow + 1),
      }
      : null
  const rowsForMax = [targetRow, ...(nationalLayout != null ? [nationalLayout.row] : [])]
  const maxRow = Math.max(0, ...rowsForMax)
  const topZoneMinHeightPx = (maxRow + 1) * bubbleRowPx + bubbleApproxH + 8
  return {
    target: { leftPct: targetPlaced.pct, row: targetRow },
    national: nationalLayout,
    maxRow,
    topZoneMinHeightPx,
    bubbleRowPx,
    bubbleApproxH,
  }
}

export function CarbonScoreCircle({
  score,
  message,
  showDetailsHint = true,
  nationalAverageKg,
  showComparisonsGrid = true,
  density = 'default',
  showDecorativeAccent = true,
}: CarbonScoreCircleProps) {
  const isCompact = density === 'compact'
  const bubbleRowPx = isCompact ? 22 : TOP_BUBBLE_ROW_PX
  const bubbleApproxH = isCompact ? 6 : TOP_BUBBLE_APPROX_H

  const tonnes = score >= 100 ? score / 1000 : score
  const nationalTonnes =
    nationalAverageKg != null && Number.isFinite(nationalAverageKg) ? nationalAverageKg / 1000 : null
  const climateTargetTonnes = 7.1
  const scaleMax = Math.max(tonnes, nationalTonnes ?? 0, climateTargetTonnes) * 1.08
  const scorePercent = Math.min(100, Math.max(0, (tonnes / scaleMax) * 100))
  const nationalPercent =
    nationalTonnes != null ? Math.min(100, Math.max(0, (nationalTonnes / scaleMax) * 100)) : null
  const targetPercent = Math.min(100, Math.max(0, (climateTargetTonnes / scaleMax) * 100))
  const diffVsNational = nationalTonnes != null ? tonnes - nationalTonnes : null
  const isBelowNational = diffVsNational != null && diffVsNational <= 0
  const nationalTForTone = nationalTonnes ?? 10
  const tone = getFootprintScoreTone(tonnes, nationalTForTone, climateTargetTonnes)
  const progressBarClassName = getFootprintScoreToneGaugeGradient(tone)
  const nationalDiffLabel =
    diffVsNational == null
      ? 'référence indisponible'
      : Math.abs(diffVsNational) < 0.05
        ? 'même niveau'
        : `${diffVsNational < 0 ? '-' : '+'}${formatTonnes(Math.abs(diffVsNational))} t d’écart`
  const climateTargetLabel = climateTargetTonnes.toFixed(1).replace('.', ',')

  const topLayout = layoutTopAnnotations(targetPercent, nationalPercent, bubbleRowPx, bubbleApproxH)
  const br = topLayout.bubbleRowPx
  const bh = topLayout.bubbleApproxH

  return (
    <section
      className={cn(
        'overflow-visible rounded-[1.7rem] border border-white/80 bg-white shadow-[0_18px_45px_-20px_rgba(26,77,62,0.42)] ring-1 ring-[#1A4D3E]/6',
        isCompact && 'rounded-2xl shadow-[0_12px_32px_-16px_rgba(26,77,62,0.38)]',
      )}
      aria-label="Synthèse de votre score carbone"
    >
      <div
        className={cn(
          'relative isolate overflow-visible px-4 pb-4 pt-4',
          isCompact && 'px-3 pb-3 pt-3',
        )}
      >
        {showDecorativeAccent ? (
          <div
            className={cn(
              'pointer-events-none absolute -right-16 -top-20 size-44 rounded-full bg-linear-to-br opacity-20 blur-2xl',
              getFootprintScoreToneAccentBlur(tone),
            )}
            aria-hidden
          />
        ) : null}
        <div className="relative flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                'flex items-center gap-1.5 font-bold uppercase tracking-[0.15em] text-[#1A4D3E]/70',
                isCompact ? 'text-xs' : 'text-sm',
              )}
            >
              <Activity className={cn(isCompact ? 'size-3' : 'size-3.5')} aria-hidden />
              Empreinte
            </p>
            <div
              className={cn(
                'flex items-end gap-2',
                isCompact ? 'mt-2' : 'mt-3',
                getFootprintScoreToneTextClass(tone),
              )}
            >
              <p
                className={cn(
                  'font-black leading-none tracking-[-0.06em]',
                  isCompact ? 'text-4xl' : 'text-5xl',
                )}
              >
                {formatTonnes(tonnes)}
              </p>
              <div className={cn(isCompact ? 'pb-1' : 'pb-1.5')}>
                <p className={cn('font-extrabold leading-none', isCompact ? 'text-sm' : 'text-base')}>
                  t
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  CO₂e/an
                </p>
              </div>
            </div>
          </div>

          {message ? (
            <div
              className={cn(
                'shrink-0 rounded-full font-bold ring-1',
                isCompact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]',
                getFootprintScoreToneBadgeClass(tone),
              )}
            >
              {message.replace('Niveau climat : ', '')}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'relative overflow-visible rounded-2xl bg-slate-50/90 ring-1 ring-slate-900/5',
            isCompact ? 'mt-3 p-2' : 'mt-5 p-3',
          )}
        >
          <p
            className={cn(
              'font-bold uppercase tracking-wide text-slate-500',
              isCompact ? 'mb-1.5 text-[10px]' : 'mb-2 text-[11px]',
            )}
          >
            Positionnement
          </p>

          {/* Jauge : bulles + pointillés alignés sur les mêmes % que les repères sur la barre */}
          <div className="relative w-full overflow-visible">
            {/* Zone supérieure : hauteur = f(nombre de rangées de bulles 2030 / moy. nat.) */}
            <div
              className="relative w-full overflow-visible"
              style={{ minHeight: topLayout.topZoneMinHeightPx }}
              aria-hidden
            >
              {/* Pointillés : du bas de la bulle jusqu’à la barre (même abscisse que le trait plein) */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
                style={{
                  top: topLayout.target.row * br + bh,
                }}
                aria-hidden
              >
                <div
                  className="absolute bottom-0 top-0 w-0 -translate-x-1/2 border-l-2 border-dashed border-[#1A4D3E]/50"
                  style={{ left: `${targetPercent}%` }}
                />
              </div>
              {nationalPercent != null && topLayout.national != null ? (
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-0"
                  style={{
                    top: topLayout.national.row * br + bh,
                  }}
                  aria-hidden
                >
                  <div
                    className="absolute bottom-0 top-0 w-0 -translate-x-1/2 border-l-2 border-dashed border-slate-500/55"
                    style={{ left: `${nationalPercent}%` }}
                  />
                </div>
              ) : null}

              <div
                className="absolute z-2 -translate-x-1/2"
                style={{
                  left: `${topLayout.target.leftPct}%`,
                  top: topLayout.target.row * br,
                }}
              >
                <span className="inline-flex max-w-22 flex-col items-center rounded-md bg-[#1A4D3E]/90 px-2 py-1 text-center shadow-md ring-1 ring-black/10">
                  <span className="text-[8px] font-bold uppercase leading-none tracking-wide text-white/95">
                    Objectif 2030
                  </span>
                  <span className="mt-0.5 text-[10px] font-bold tabular-nums leading-none text-white">
                    {climateTargetLabel} t
                  </span>
                </span>
              </div>
              {nationalPercent != null && topLayout.national != null ? (
                <div
                  className="absolute z-2 -translate-x-1/2"
                  style={{
                    left: `${topLayout.national.leftPct}%`,
                    top: topLayout.national.row * br,
                  }}
                >
                  <span className="inline-flex max-w-22 flex-col items-center rounded-md bg-slate-800/75 px-2 py-1 text-center shadow-md ring-1 ring-black/10">
                    <span className="text-[8px] font-bold uppercase leading-none tracking-wide text-white/95">
                      Moy. nat.
                    </span>
                    <span className="mt-0.5 text-[10px] font-bold tabular-nums leading-none text-white">
                      {nationalTonnes != null ? `${formatTonnes(nationalTonnes)} t` : '—'}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>

            <div
              className="relative z-2 mt-0 h-3 w-full overflow-visible"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={Math.round(scaleMax)}
              aria-valuenow={Number(tonnes.toFixed(1))}
              aria-label={`Votre empreinte est de ${formatTonnes(tonnes)} tonnes CO₂e par an`}
            >
              <div className="absolute inset-0 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-slate-200/80">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-linear-to-r',
                    progressBarClassName,
                  )}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div
                className="pointer-events-none absolute top-1/2 z-1 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1A4D3E] ring-2 ring-white"
                style={{ left: `${targetPercent}%` }}
                title={`Objectif 2030 : ${climateTargetLabel} tonnes de CO₂ par personne/an`}
                aria-hidden
              />
              {nationalPercent != null ? (
                <div
                  className="pointer-events-none absolute top-1/2 z-1 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 ring-2 ring-white"
                  style={{ left: `${nationalPercent}%` }}
                  title="Moyenne nationale"
                  aria-hidden
                />
              ) : null}
              <div
                className={cn(
                  'pointer-events-none absolute top-1/2 z-3 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-sm ring-2 ring-white',
                  getFootprintScoreToneMarkerClass(tone),
                )}
                style={{ left: `${scorePercent}%` }}
                title={`Vous : ${formatTonnes(tonnes)} t CO₂e/an`}
                aria-hidden
              />
            </div>

            <div
              className="relative z-1 mt-0 w-full overflow-visible pb-1"
              style={{ minHeight: bh + br + 6 }}
              aria-hidden
            >
              {/* Pointillés : du bas de la barre jusqu’au haut de la bulle « Vous » (descendant). */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-0"
                style={{ bottom: bh }}
                aria-hidden
              >
                <div
                  className={cn(
                    'absolute inset-y-0 w-0 -translate-x-1/2 border-l-2 border-dashed',
                    tone === 'red' && 'border-red-600/55',
                    tone === 'orange' && 'border-orange-600/55',
                    tone === 'green' && 'border-emerald-600/55',
                  )}
                  style={{ left: `${scorePercent}%` }}
                />
              </div>
              <div
                className="absolute bottom-0 z-2 -translate-x-1/2"
                style={{ left: `${scorePercent}%` }}
              >
                <span
                  className={cn(
                    'inline-flex max-w-22 flex-col items-center rounded-md bg-white px-2 py-1 text-center shadow-md ring-2 ring-offset-1 ring-offset-slate-50/90',
                    tone === 'red' && 'ring-red-600/85',
                    tone === 'orange' && 'ring-orange-600/85',
                    tone === 'green' && 'ring-emerald-600/85',
                  )}
                >
                  <span
                    className={cn(
                      'text-[7px] font-bold uppercase leading-none tracking-wide',
                      tone === 'red' && 'text-red-800',
                      tone === 'orange' && 'text-orange-900',
                      tone === 'green' && 'text-emerald-800',
                    )}
                  >
                    Vous
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 text-[10px] font-bold tabular-nums leading-none',
                      getFootprintScoreToneTextClass(tone),
                    )}
                  >
                    {formatTonnes(tonnes)} t
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'flex justify-between font-semibold text-slate-500',
              isCompact ? 'mt-1.5 text-[9px]' : 'mt-2 text-[10px]',
            )}
          >
            <span>0 t</span>
            <span>{formatTonnes(scaleMax)} t</span>
          </div>
        </div>

        {showComparisonsGrid ? (
          <div className={cn('grid grid-cols-2 gap-2', isCompact ? 'mt-2' : 'mt-3')}>
            <div
              className={cn(
                'rounded-2xl border border-emerald-900/8 bg-emerald-50/80',
                isCompact ? 'p-2' : 'p-3',
              )}
            >
              <div className="flex items-center gap-2 text-[#1A4D3E]">
                <Target className="size-4" aria-hidden />
                <p className="text-[10px] font-bold uppercase tracking-wide">À réduire</p>
              </div>
              <p className="mt-1 text-lg font-black tabular-nums text-[#1b3d32]">
                {formatTonnes(Math.max(0, tonnes - climateTargetTonnes))} t
              </p>
              <p className="text-[11px] leading-tight text-slate-600">pour atteindre 7,1 t en 2030</p>
            </div>

            <div
              className={cn(
                'rounded-2xl border border-slate-900/8 bg-slate-50',
                isCompact ? 'p-2' : 'p-3',
              )}
            >
              <div className="flex items-center gap-2 text-slate-700">
                {isBelowNational ? (
                  <TrendingDown className="size-4 text-emerald-600" aria-hidden />
                ) : (
                  <TrendingUp className="size-4 text-amber-600" aria-hidden />
                )}
                <p className="text-[10px] font-bold uppercase tracking-wide">Moy. nationale</p>
              </div>
              <p className="mt-1 text-lg font-black tabular-nums text-[#1b3d32]">
                {nationalTonnes != null ? `${formatTonnes(nationalTonnes)} t` : 'N/A'}
              </p>
              <p className="text-[11px] leading-tight text-slate-600">
                {nationalDiffLabel}
              </p>
            </div>
          </div>
        ) : null}

        {showDetailsHint ? (
          <div
            className={cn(
              'flex items-center gap-2 rounded-2xl bg-white/75 font-semibold leading-snug text-[#1A4D3E] ring-1 ring-[#1A4D3E]/8',
              isCompact ? 'mt-2 px-2.5 py-1.5 text-[11px]' : 'mt-3 px-3 py-2 text-xs',
            )}
          >
            <Leaf className="size-4 shrink-0" aria-hidden />
            Détail par poste ci-dessous.
          </div>
        ) : null}
      </div>
    </section>
  )
}
