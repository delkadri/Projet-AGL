import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type CategoryCardProps = {
  name: string
  score: number
  maxScore: number
  percentage: number
  /**
   * Ratio émissions utilisateur / moyenne nationale pour la catégorie :
   * sous la moyenne vert, niveau équivalent orange, au-dessus rouge.
   * Détermine la couleur de la jauge. À défaut, calcul possible via `score` et `nationalAverageT`.
   */
  ratioVsNational?: number
  /** Conservé pour compat ; ignoré si `ratioVsNational` (ou calcul kg) est disponible. */
  comparisonColor?: 'green' | 'yellow' | 'red'
  /**
   * Repli si `nationalAverageT` est absent : position du trait « moy. nat. » en % du total bilan (0–100).
   * Quand `nationalAverageT` est fourni, l’échelle comparative tonnes est utilisée à la place.
   */
  referencePercent?: number
  /** Moyenne nationale pour cette catégorie (t CO₂e/an), affichée sur la jauge. */
  nationalAverageT?: number
  /**
   * Max en tonnes commun à toutes les cartes du même écran (ex. max sur les catégories du bilan).
   * Les largeurs de barre sont alors proportionnelles entre postes qui pèsent plus ou moins.
   */
  categoryBarScaleMaxT?: number
  /** Icône de la catégorie, affichée à gauche du nom. */
  icon?: ReactNode
  /** Contenu optionnel à droite (ex. bouton détail) */
  trailing?: ReactNode
  /** Bloc dépliable affiché sous la jauge quand `expanded` est true */
  expandableContent?: ReactNode
  expanded?: boolean
}

export function CategoryCard({
  name,
  score,
  maxScore: _maxScore,
  percentage,
  ratioVsNational,
  comparisonColor,
  referencePercent,
  nationalAverageT,
  categoryBarScaleMaxT,
  icon,
  trailing,
  expandableContent,
  expanded = false,
}: CategoryCardProps) {
  const NATIONAL_EQUALITY_TOLERANCE = 0.01

  const barColorFromNationalRatio = (ratio: number) => {
    if (ratio < 1 - NATIONAL_EQUALITY_TOLERANCE) return 'bg-emerald-500'
    if (ratio <= 1 + NATIONAL_EQUALITY_TOLERANCE) return 'bg-amber-400'
    return 'bg-red-500'
  }

  const barColorFromComparisonFlag = (c: 'green' | 'yellow' | 'red') =>
    c === 'green' ? 'bg-emerald-500' : c === 'yellow' ? 'bg-amber-400' : 'bg-red-500'

  const resolvedRatio =
    nationalAverageT != null && nationalAverageT > 0
      ? score / nationalAverageT
      : nationalAverageT === 0 && score > 0
        ? 10
        : ratioVsNational != null && Number.isFinite(ratioVsNational)
          ? ratioVsNational
          : null

  const barColorClass =
    resolvedRatio != null
      ? barColorFromNationalRatio(resolvedRatio)
      : comparisonColor != null
        ? barColorFromComparisonFlag(comparisonColor)
        : 'bg-[#1A4D3E]/80'

  /**
   * Échelle en tonnes : d’abord un max partagé entre toutes les cartes du bilan (proportion visuelle),
   * sinon max local (votre poste vs moyenne nationale) × marge, sinon part du bilan (`percentage`).
   */
  const COMPARISON_SCALE_MARGIN = 1.08
  const nationalRefT =
    nationalAverageT != null && Number.isFinite(nationalAverageT) && nationalAverageT > 0
      ? nationalAverageT
      : null

  const canUseSharedTonnesScale =
    categoryBarScaleMaxT != null &&
    Number.isFinite(categoryBarScaleMaxT) &&
    categoryBarScaleMaxT > 0

  const perCategoryScaleMaxT =
    nationalRefT != null ? Math.max(score, nationalRefT) * COMPARISON_SCALE_MARGIN : null

  const tonnesScaleMaxT = canUseSharedTonnesScale ? categoryBarScaleMaxT : perCategoryScaleMaxT

  const userFillOnTonnesScale =
    tonnesScaleMaxT != null && tonnesScaleMaxT > 0
      ? Math.min(100, Math.max(0, (score / tonnesScaleMaxT) * 100))
      : null

  const nationalMarkerOnTonnesScale =
    nationalRefT != null && tonnesScaleMaxT != null && tonnesScaleMaxT > 0
      ? Math.min(100, Math.max(0, (nationalRefT / tonnesScaleMaxT) * 100))
      : null

  const hasNationalComparisonScale = nationalRefT != null

  /** Ancien mode : moyenne en % du total bilan (si pas de tonnes nationales exploitables). */
  const refPctLegacy =
    !hasNationalComparisonScale &&
      referencePercent != null &&
      Number.isFinite(referencePercent)
      ? Math.min(100, Math.max(0, referencePercent))
      : null

  const barFillPercent =
    userFillOnTonnesScale != null ? userFillOnTonnesScale : Math.min(100, Math.max(0, percentage))

  /** Position du libellé « Moy. nat. » : léger clamp pour éviter le débordement de la carte. */
  const nationalLabelLeftPct =
    nationalMarkerOnTonnesScale != null
      ? Math.min(92, Math.max(8, nationalMarkerOnTonnesScale))
      : refPctLegacy != null
        ? Math.min(92, Math.max(8, refPctLegacy))
        : null

  const scoreDisplay = score < 10 ? score.toFixed(2) : score.toFixed(1)
  const hasNationalRef = nationalMarkerOnTonnesScale != null || refPctLegacy != null
  const nationalAvgDisplay =
    nationalAverageT != null && Number.isFinite(nationalAverageT)
      ? nationalAverageT < 10
        ? nationalAverageT.toFixed(2)
        : nationalAverageT.toFixed(1)
      : null

  const nationalMarkerLinePct = nationalMarkerOnTonnesScale ?? refPctLegacy

  /** Écart à combler pour s’aligner sur la moyenne nationale (t CO₂e/an), si au-dessus. */
  const effortTonnesToReachNational =
    nationalRefT != null && resolvedRatio != null && resolvedRatio > 1 + NATIONAL_EQUALITY_TOLERANCE
      ? Math.max(0, score - nationalRefT)
      : null
  const effortDisplay =
    effortTonnesToReachNational != null && effortTonnesToReachNational > 1e-6
      ? effortTonnesToReachNational < 10
        ? effortTonnesToReachNational.toFixed(2)
        : effortTonnesToReachNational.toFixed(1)
      : null

  return (
    <div
      className={cn(
        'overflow-visible rounded-xl border border-[#1A4D3E]/10 bg-white p-3 shadow-sm',
        expanded && 'ring-2 ring-[#1A4D3E]/12',
      )}
    >
      <div className="flex min-h-9 items-center gap-2">
        {icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#1A4D3E] ring-1 ring-[#1A4D3E]/10">
            {icon}
          </div>
        ) : null}
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold leading-tight tracking-tight text-[#1b3d32]">
          {name}
        </h3>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-right text-[13px] tabular-nums leading-none text-slate-800">
            <span className="font-bold">{scoreDisplay} t</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-bold text-[#1A4D3E]">{percentage}%</span>
          </p>
          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      </div>

      {effortDisplay != null ? (
        <p className="mt-2 text-left text-[12px] leading-snug text-rose-800/95">
          <span className="font-semibold">Objectif 2030 :</span>{' '}
          réduire d’environ{' '}
          <span className="font-bold tabular-nums">{effortDisplay} t</span> CO₂e/an.
        </p>
      ) : null}

      <div className={cn('relative', hasNationalRef && 'mt-0')}>
        {hasNationalRef && nationalLabelLeftPct != null ? (
          <div className="relative mb-1 min-h-9 w-full" aria-hidden>
            <div
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${nationalLabelLeftPct}%` }}
            >
              <span className="inline-flex max-w-22 flex-col items-center rounded-md bg-slate-800/70 px-2 py-0.5 text-center shadow-md ring-1 ring-black/10">
                <span className="text-[7px] font-bold uppercase leading-none tracking-wide text-white/95">
                  Moy. nat.
                </span>
                {nationalAvgDisplay != null ? (
                  <span className="mt-0.5 text-[10px] font-bold tabular-nums leading-none text-white">
                    {nationalAvgDisplay} t
                  </span>
                ) : null}
              </span>
            </div>
          </div>
        ) : null}
        <div
          className="relative h-2.5 w-full overflow-visible"
          role="progressbar"
          aria-valuenow={Math.round(barFillPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={
            hasNationalComparisonScale
              ? nationalAvgDisplay != null
                ? `${name} : ${scoreDisplay} t sur la catégorie (${percentage} % de votre bilan). Référence moyenne nationale ${nationalAvgDisplay} t CO₂e par an.`
                : `${name} : ${scoreDisplay} t (${percentage} % de votre bilan), positionnement vs moyenne nationale.`
              : hasNationalRef
                ? nationalAvgDisplay != null
                  ? `${name} : ${percentage} % de votre bilan. Moyenne nationale ${nationalAvgDisplay} tonnes CO₂e par an.`
                  : `${name} : ${percentage} % de votre bilan. Moyenne nationale pour ce poste.`
                : `${name} : ${percentage} % du bilan total`
          }
        >
          <div className="absolute inset-0 overflow-hidden rounded-full bg-slate-100 shadow-inner">
            <div
              className={cn(
                'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out',
                barColorClass,
              )}
              style={{ width: `${barFillPercent}%` }}
            />
          </div>
          {hasNationalRef && nationalMarkerLinePct != null ? (
            <div
              className="pointer-events-none absolute top-1/2 z-1 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-800 shadow-md ring-2 ring-white"
              style={{ left: `${nationalMarkerLinePct}%` }}
              title={
                nationalAvgDisplay != null
                  ? `Moyenne nationale : ${nationalAvgDisplay} t CO₂e/an (indicatif)`
                  : 'Moyenne nationale (référence indicative)'
              }
            />
          ) : null}
        </div>
      </div>

      {expanded && expandableContent != null && (
        <div className="-mx-3 -mb-3 mt-2.5 overflow-hidden rounded-b-xl border-t border-[#1A4D3E]/8 bg-linear-to-b from-emerald-50/70 to-slate-50/50 px-3 pb-3 pt-2">
          {expandableContent}
        </div>
      )}
    </div>
  )
}
