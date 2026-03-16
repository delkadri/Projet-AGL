import { useState } from 'react'
import { Info, Bug } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { CarbonScoreCircle } from '@/components/carbon/CarbonScoreCircle'
import { CategoryCard } from '@/components/carbon/CategoryCard'

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
}

function getClimateLevelLabel(level: string): string {
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

const DEFAULT_FINISH_ACTION = { label: `Retour à l'accueil`, to: '/' } as const

export function QuizResult({ result, finishAction = DEFAULT_FINISH_ACTION }: QuizResultProps) {
  const navigate = useNavigate()
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  const { score, categories, quizName } = result
  const totalKg = score.totalKgCo2ePerYear
  const totalT = totalKg / 1000
  const publicServicesKg = score.publicServicesFixedKg ?? 0
  const publicServicesT = publicServicesKg / 1000

  return (
    <div className="flex min-h-screen flex-col overflow-y-auto bg-linear-to-b from-green-50 to-blue-50">
      <div className="px-4 py-4">
        <img
          src="/logo-vertical.png"
          alt="TerraScore"
          className="mx-auto w-auto max-w-[200px] object-contain"
        />
      </div>

      <div className="px-4 py-1 text-center">
        <h1 className="text-xl font-bold text-gray-900">{quizName}</h1>
      </div>

      <div className="px-4 py-2">
        <CarbonScoreCircle
          score={totalKg}
          climateLevel={score.climateLevel}
          message={`Niveau climat : ${getClimateLevelLabel(score.climateLevel)}`}
        />
      </div>

      {categories && categories.length > 0 ? (
        <div className="space-y-3 px-4 py-3">
          {categories.map((category) => {
            const { id: categoryId, name, items } = category
            const categoryTotalKg = items.reduce((s, i) => s + i.valueKgCo2ePerYear, 0)
            const categoryTotalT = categoryTotalKg / 1000
            const percentage = totalKg > 0 ? Math.round((categoryTotalKg / totalKg) * 100) : 0
            const isExpanded = expandedCategoryId === categoryId

            const expandableContent = (
              <>
                <p className="mb-1.5 text-xs font-medium text-gray-600">Répartition</p>
                <div className="space-y-3">
                  {items.map((item) => {
                    const itemT = item.valueKgCo2ePerYear / 1000
                    const itemPct =
                      categoryTotalKg > 0
                        ? Math.round((item.valueKgCo2ePerYear / categoryTotalKg) * 100)
                        : 0
                    return (
                      <div key={item.key}>
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="text-gray-700">{item.label}</span>
                          <span className="font-medium text-gray-900">
                            {itemT.toFixed(2)} t ({itemPct}%)
                          </span>
                        </div>

                        {/* Panneau debug par poste */}
                        {debugMode && item.debug && (
                          <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs">
                            <div className="mb-1 flex items-center gap-1 font-semibold text-amber-700">
                              <Bug className="h-3 w-3" />
                              Debug
                            </div>
                            <div className="space-y-0.5 text-amber-800">
                              <div>
                                <span className="font-medium">Source : </span>
                                <span
                                  className={
                                    item.debug.factorSource === 'ademe-api'
                                      ? 'font-semibold text-green-700'
                                      : item.debug.factorSource === 'ademe-empreinte'
                                        ? 'font-semibold text-blue-700'
                                        : 'font-semibold text-orange-600'
                                  }
                                >
                                  {item.debug.factorSource === 'ademe-api'
                                    ? '✓ ADEME Base Carbone (API)'
                                    : item.debug.factorSource === 'ademe-empreinte'
                                      ? '📗 ADEME Base Empreinte (étude)'
                                      : '⚠ Estimation'}
                                </span>
                              </div>
                              {item.debug.ademeReference && (
                                <div>
                                  <span className="font-medium">Référence : </span>
                                  {item.debug.ademeReference}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Facteur : </span>
                                {item.debug.factorValue} {item.debug.factorUnit}
                              </div>
                              <div className="mt-1 rounded bg-amber-100 px-1.5 py-1 font-mono text-[10px] text-amber-900">
                                {item.debug.formula}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )

            return (
              <CategoryCard
                key={categoryId}
                name={name}
                score={categoryTotalT}
                maxScore={totalT}
                percentage={percentage}
                trailing={
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryId(isExpanded ? null : categoryId)}
                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label={`Voir la répartition pour ${name}`}
                    title="Voir la répartition"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                }
                expandableContent={expandableContent}
                expanded={isExpanded}
              />
            )
          })}
        </div>
      ) : null}

      {publicServicesKg > 0 && (
        <div className="mx-4 mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Part fixe ADEME
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm text-slate-700">
              Services publics (hôpitaux, routes, écoles, administration…)
            </span>
            <span className="font-semibold text-slate-900">
              {publicServicesT.toFixed(2)} t CO₂e/an
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Répartie de manière égale entre tous les habitants, selon la méthodologie ADEME.
          </p>
        </div>
      )}

      <div className="space-y-3 px-4 pb-8 pt-4">
        <Button
          type="button"
          className="w-full bg-[#1A4D3E] text-white hover:bg-[#153936]"
          onClick={() => navigate({ to: finishAction.to })}
        >
          {finishAction.label}
        </Button>

        {/* Outils développeur */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setDebugMode((v) => !v)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-colors ${
              debugMode
                ? 'border-amber-400 bg-amber-50 font-medium text-amber-700 hover:bg-amber-100'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            <Bug className="h-4 w-4" />
            {debugMode ? 'Masquer le mode debug' : 'Mode debug (détail calculs)'}
          </button>

          <Button
            type="button"
            variant="outline"
            className="w-full text-gray-500"
            onClick={() => setShowJson((v) => !v)}
          >
            {showJson ? 'Masquer le JSON' : 'Afficher le résultat en JSON'}
          </Button>

          {showJson && (
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-gray-700 bg-gray-900 p-3 text-xs text-gray-100">
              <code>{JSON.stringify(result, null, 2)}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
