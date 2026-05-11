import { useMemo, useState } from 'react'
import {
  CarFront,
  ChevronDown,
  Home,
  Landmark,
  Leaf,
  ShoppingBag,
  Smartphone,
  Utensils,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { CarbonScoreCircle } from '@/components/carbon/CarbonScoreCircle'
import { CategoryCard } from '@/components/carbon/CategoryCard'
import { cn } from '@/lib/utils'

/**
 * Source du facteur d'émission :
 * - `ademe-api`        : valeur obtenue en temps réel depuis l'API ADEME Base Carbone
 * - `ademe-empreinte`  : valeur publiée par l'ADEME Base Empreinte (étude cycle de vie, pas d'API)
 * - `estimate`         : valeur estimée non officielle
 */
export type QuizBreakdownDebugInfo = {
  factorSource: 'ademe-api' | 'ademe-empreinte' | 'estimate'
  factorValue: number
  factorUnit: string
  ademeReference?: string
  formula: string
}

/** Poste du bilan (item dans une catégorie). */
export type QuizScoreBreakdownItem = {
  key: string
  label: string
  valueKgCo2ePerYear: number
  debug?: QuizBreakdownDebugInfo
}

/** Catégorie du bilan avec ses postes. */
export type QuizCategoryBilan = {
  id: string
  name: string
  items: QuizScoreBreakdownItem[]
}

export type QuizOnboardingBilanCategory = {
  categoryId: string
  name: string
  userKgCo2ePerYear: number
  nationalAvgKgCo2ePerYear: number
  ratioVsNational: number
  comparison: 'below' | 'average' | 'above'
  color: 'green' | 'yellow' | 'red'
}

/** Comparaison du bilan utilisateur aux moyennes nationales (réponse de `POST …/score`). */
export type QuizOnboardingBilan = {
  nationalTotalKgCo2ePerYear: number
  nationalPublicServicesKgCo2ePerYear: number
  personalFootprintPoolKgCo2ePerYear: number
  dataSource: {
    provider: string
    datasetId: string
    rowLabel: string
    yearColumn: string | null
    apiUrl: string
  }
  fetchedAt: string
  apiReachable: boolean
  topCategoriesAboveNational: Array<{
    categoryId: string
    name: string
    userKgCo2ePerYear: number
    nationalAvgKgCo2ePerYear: number
    excessKgCo2ePerYear: number
    ratioVsNational: number
  }>
  categories: QuizOnboardingBilanCategory[]
}

/**
 * Bilan complet renvoyé par le backend (déjà groupé par catégorie).
 */
export type QuizCalculateScoreResponse = {
  quizId: string
  quizName: string
  score: {
    totalKgCo2ePerYear: number
    climateLevel: string
    /** Part fixe ADEME : services publics (hôpitaux, routes, écoles…) — affichée dans le bilan. */
    publicServicesFixedKg?: number
  }
  categories: QuizCategoryBilan[]
  onboardingBilan?: QuizOnboardingBilan
}

export type QuizScoreHistoryPoint = {
  at: string
  totalKgCo2ePerYear: number
}

type QuizResultProps = {
  result: QuizCalculateScoreResponse
  /** Bouton affiché en bas du bilan. Si absent : "Retour à l'accueil" vers / */
  finishAction?: { label: string; to: string }
  history?: QuizScoreHistoryPoint[]
  /** `onboarding` : écran de révélation sans liste des catégories (fin du quiz d’accueil). */
  variant?: 'default' | 'onboarding'
}

export function getClimateLevelLabel(level: string): string {
  switch (level) {
    case 'low':
      return 'Faible'
    case 'medium':
      return 'Moyen'
    case 'high':
      return 'Élevé'
    default:
      return level
  }
}

function getCategoryIcon(categoryId: string, name: string) {
  const iconClassName = 'size-4.5'
  const normalizedName = name.toLowerCase()

  if (categoryId.includes('transport') || normalizedName.includes('transport')) {
    return <CarFront className={iconClassName} aria-hidden />
  }
  if (categoryId.includes('logement') || normalizedName.includes('logement')) {
    return <Home className={iconClassName} aria-hidden />
  }
  if (categoryId.includes('alimentation') || normalizedName.includes('alimentation')) {
    return <Utensils className={iconClassName} aria-hidden />
  }
  if (categoryId.includes('consommation') || normalizedName.includes('consommation')) {
    return <ShoppingBag className={iconClassName} aria-hidden />
  }
  if (categoryId.includes('numerique') || normalizedName.includes('numérique')) {
    return <Smartphone className={iconClassName} aria-hidden />
  }
  if (categoryId.includes('services') || normalizedName.includes('services')) {
    return <Landmark className={iconClassName} aria-hidden />
  }
  return <Leaf className={iconClassName} aria-hidden />
}

const DEFAULT_FINISH_ACTION = { label: `Retour à l'accueil`, to: '/' } as const

export function QuizResult({
  result,
  finishAction = DEFAULT_FINISH_ACTION,
  variant = 'default',
}: QuizResultProps) {
  const navigate = useNavigate()
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const isOnboarding = variant === 'onboarding'

  const { score, categories, onboardingBilan } = result
  const totalKg = score.totalKgCo2ePerYear
  const totalT = totalKg / 1000
  const publicServicesKg = score.publicServicesFixedKg ?? 0
  const publicServicesT = publicServicesKg / 1000

  const comparisonByCategoryId = new Map(
    onboardingBilan?.categories.map((c) => [c.categoryId, c]) ?? [],
  )

  /** Même échelle en tonnes pour toutes les cartes : les barres reflètent le poids relatif de chaque poste. */
  const categoryBarScaleMaxT = useMemo(() => {
    if (!categories?.length) return undefined
    let m = 0
    for (const cat of categories) {
      const kg = cat.items.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
      const userT = kg / 1000
      const nat = comparisonByCategoryId.get(cat.id)
      const natT = nat != null ? nat.nationalAvgKgCo2ePerYear / 1000 : 0
      m = Math.max(m, userT, natT)
    }
    return m > 0 ? m * 1.08 : undefined
  }, [categories, onboardingBilan])

  const scoreCircle = (
    <CarbonScoreCircle
      score={totalKg}
      climateLevel={score.climateLevel}
      message={`Niveau climat : ${getClimateLevelLabel(score.climateLevel)}`}
      showDetailsHint={false}
      nationalAverageKg={onboardingBilan?.nationalTotalKgCo2ePerYear}
      showComparisonsGrid={!isOnboarding}
      density={isOnboarding ? 'compact' : 'default'}
      showDecorativeAccent={!isOnboarding}
    />
  )

  if (isOnboarding) {
    return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f0f7f0]">
        <header className="mx-auto w-full max-w-lg shrink-0 px-4 pt-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0 [@media(max-height:700px)]:pt-3">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1A4D3E]/60 sm:text-[11px]">
            Résultat
          </p>
          <h1 className="text-balance text-xl font-bold tracking-tight text-[#1C5138] sm:mt-1 sm:text-2xl">
            Votre empreinte carbone estimée
          </h1>
        </header>

        <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col justify-center overflow-hidden px-4 py-1 [@media(max-height:700px)]:py-1">
          <div className="relative flex min-h-0 w-full flex-1 flex-col justify-center overflow-hidden">
            <div
              className={cn(
                'relative w-full shrink-0 origin-center animate-in zoom-in-95 fade-in duration-700 ease-out fill-mode-both [animation-delay:90ms]',
                '[@media(max-height:620px)]:scale-[0.9] [@media(max-height:520px)]:scale-[0.82]',
                'motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:transform-none',
              )}
            >
              {scoreCircle}
            </div>

            {categories && categories.length > 0 ? (
              <section
                className="pointer-events-none mt-3 min-h-0 w-full max-h-[min(32vh,220px)] shrink animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:120ms] motion-reduce:animate-none motion-reduce:opacity-100 [@media(max-height:700px)]:mt-2 [@media(max-height:700px)]:max-h-[min(26vh,180px)]"
                aria-label="Aperçu des catégories : noms visibles, montants masqués jusqu’à la suite du parcours."
              >
                <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[#1A4D3E]/65">
                  Catégories
                </p>
                <p className="mt-0.5 text-center text-xs leading-snug text-[#1A4D3E]/75">
                  Les catégories seront détaillées dans le bilan complet.
                </p>
                <ul
                  className="mt-2 space-y-1.5 overflow-y-auto overscroll-y-contain pr-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="list"
                >
                  {[...categories]
                    .map((cat) => {
                      const catKg = cat.items.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
                      return { cat, catKg }
                    })
                    .sort((a, b) => b.catKg - a.catKg)
                    .map(({ cat, catKg }) => {
                      const pct = totalKg > 0 ? Math.round((catKg / totalKg) * 100) : 0
                      const barPct = Math.max(8, Math.min(100, pct))
                      return (
                        <li
                          key={cat.id}
                          className="flex items-center gap-2 rounded-lg border border-[#1A4D3E]/12 bg-white/75 px-2 py-1 shadow-sm ring-1 ring-black/3"
                        >
                          <span className="shrink-0 text-[#1A4D3E]/85">
                            {getCategoryIcon(cat.id, cat.name)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#1b3d32]">
                            {cat.name}
                          </span>
                          <div className="h-4 w-18 shrink-0 overflow-hidden rounded-full bg-slate-200/85">
                            <div
                              className="h-full rounded-full bg-linear-to-r from-[#1A4D3E]/25 to-[#1A4D3E]/50"
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span
                            className="w-9 shrink-0 text-right text-[10px] font-bold tabular-nums text-slate-500 blur-[3px]"
                            aria-hidden
                          >
                            0.0t
                          </span>
                        </li>
                      )
                    })}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <div className="mx-auto w-full max-w-lg shrink-0 space-y-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-600 fill-mode-both [animation-delay:240ms] motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:translate-y-0">
            <Button
              type="button"
              className="h-11 w-full rounded-2xl bg-[#1A4D3E] text-[15px] font-semibold text-white shadow-[0_4px_14px_-2px_rgba(26,77,62,0.4)] hover:bg-[#153936] sm:h-12"
              onClick={() => navigate({ to: finishAction.to })}
            >
              {finishAction.label}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full min-h-0 flex-col bg-linear-to-b from-[#e8f5e9] via-[#f1f8e9] to-white pb-6">
      <div className="mx-auto w-full max-w-lg px-4 py-3">{scoreCircle}</div>

      {categories && categories.length > 0 ? (
        <div className="mx-auto w-full max-w-lg space-y-2 px-4 pb-2 pt-3">
          <div className="px-0.5">
            <h2 className="text-xl font-bold uppercase tracking-wide text-[#1A4D3E]">Catégories</h2>
          </div>
          {[...categories]
            .sort((a, b) => {
              const aTotal = a.items.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
              const bTotal = b.items.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
              return bTotal - aTotal
            })
            .map((category) => {
              const { id: categoryId, name, items } = category
              const sortedItems = [...items].sort((a, b) => b.valueKgCo2ePerYear - a.valueKgCo2ePerYear)
              const categoryTotalKg = sortedItems.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
              const categoryTotalT = categoryTotalKg / 1000
              const percentage = totalKg > 0 ? Math.round((categoryTotalKg / totalKg) * 100) : 0
              const isExpanded = expandedCategoryId === categoryId
              const nat = comparisonByCategoryId.get(categoryId)
              const comparisonColor = nat?.color
              const referencePercent =
                nat != null && totalKg > 0
                  ? Math.round((nat.nationalAvgKgCo2ePerYear / totalKg) * 100)
                  : undefined
              const nationalAverageT = nat != null ? nat.nationalAvgKgCo2ePerYear / 1000 : undefined

              const expandableContent = (
                <ul className="space-y-1.5" role="list">
                  {sortedItems.map((item) => {
                    const itemT = item.valueKgCo2ePerYear / 1000
                    const itemPct =
                      categoryTotalKg > 0
                        ? Math.round((item.valueKgCo2ePerYear / categoryTotalKg) * 100)
                        : 0
                    const itemTStr = itemT < 10 ? itemT.toFixed(2) : itemT.toFixed(1)
                    return (
                      <li
                        key={item.key}
                        className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white px-2.5 py-2"
                      >
                        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold leading-tight text-[#1b3d32]">
                          {item.label}
                        </span>
                        <span className="shrink-0 text-[12px] font-bold tabular-nums text-slate-800">
                          {itemTStr} t
                        </span>
                        <span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-[#1A4D3E] ring-1 ring-[#1A4D3E]/15">
                          {itemPct}%
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )

              return (
                <div key={categoryId}>
                  <CategoryCard
                    name={name}
                    icon={getCategoryIcon(categoryId, name)}
                    score={categoryTotalT}
                    maxScore={totalT}
                    percentage={percentage}
                    categoryBarScaleMaxT={categoryBarScaleMaxT}
                    ratioVsNational={nat?.ratioVsNational}
                    comparisonColor={comparisonColor}
                    referencePercent={referencePercent}
                    nationalAverageT={nationalAverageT}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setExpandedCategoryId(isExpanded ? null : categoryId)}
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-colors',
                          'active:scale-95 hover:border-[#1A4D3E]/30 hover:bg-emerald-50/80 hover:text-[#1A4D3E]',
                          isExpanded && 'border-[#1A4D3E]/35 bg-emerald-50 text-[#1A4D3E]',
                        )}
                        aria-expanded={isExpanded}
                        aria-label={
                          isExpanded ? `Masquer le détail pour ${name}` : `Voir le détail pour ${name}`
                        }
                        title="Postes"
                      >
                        <ChevronDown
                          className={cn('size-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                          aria-hidden
                        />
                      </button>
                    }
                    expandableContent={expandableContent}
                    expanded={isExpanded}
                  />
                </div>
              )
            })}
        </div>
      ) : null}

      {publicServicesKg > 0 && (
        <div className="mx-auto mt-2 w-full max-w-lg px-4">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-slate-50/90 px-3 py-2.5 shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Inclus au total</p>
              <p className="truncate text-[13px] font-semibold text-[#1b3d32]">Services publics (ADEME)</p>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
              {publicServicesT.toFixed(2)} t/an
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 w-full max-w-lg px-4 pb-[env(safe-area-inset-bottom,0px)] pt-2">
        <Button
          type="button"
          className="h-12 w-full rounded-2xl bg-[#1A4D3E] text-[15px] font-semibold text-white shadow-[0_4px_14px_-2px_rgba(26,77,62,0.4)] hover:bg-[#153936]"
          onClick={() => navigate({ to: finishAction.to })}
        >
          {finishAction.label}
        </Button>
      </div>
    </div>
  )
}
