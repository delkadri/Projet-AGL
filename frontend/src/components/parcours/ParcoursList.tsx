import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { Parcours } from '@/types/parcours'
import { mockParcours } from '@/data/mockParcours'
import { Button } from '@/components/ui/button'
import { ParcoursCard } from './ParcoursCard'
import { AuthBranding } from '@/components/AuthBranding'

// TODO: remplacer mockParcours par un appel API useQuery pour récupérer la liste des parcours
// Exemple: const { data: parcours } = useQuery({ queryKey: ['parcours'], queryFn: fetchParcours })

export function ParcoursList() {
  const navigate = useNavigate()
  const [isLoading] = useState(false)
  const [selectedParcoursId, setSelectedParcoursId] = useState<string | null>(null)

  const parcours: Parcours[] = mockParcours

  const handleSelectParcours = (parcoursId: string) => {
    setSelectedParcoursId(parcoursId)
  }

  const handleStartParcours = (parcoursId: string) => {
    // TODO: sauvegarder le parcours sélectionné dans le contexte/state global
    // TODO: appeler une API pour enregistrer le choix du parcours avant de naviguer
    navigate({ to: '/quiz', search: { parcoursId } })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 pb-24">
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden">
        <div className="overflow-hidden">
          <AuthBranding src="/logo-vertical.png" />
        </div>

        <div className="overflow-hidden pt-4">
          <h1 className="text-2xl font-bold text-[#1C5138] mb-2 text-center">
            Choisissez votre parcours
          </h1>
          <p className="text-black-600 text-xs text-center">
              Le choix de parcours n'est pas définitif.
          </p>
          <p className="text-black-600 text-xs text-center">
              Un <b>défi</b> est un objectif à réaliser pour une période.
          </p>
          <p className="text-black-600 text-xs text-center">
              Le <b>quizz</b> permet de mettre à jour votre score carbone et voir votre évolution.
          </p>
        </div>

        <div className="min-h-0 overflow-hidden pt-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Chargement des parcours...</p>
            </div>
          )}

          {/* Parcours Grid - Mobile optimized */}
          {!isLoading && parcours.length > 0 && (
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {parcours.map((p) => (
                <ParcoursCard
                  key={p.id}
                  parcours={p}
                  onSelect={handleSelectParcours}
                  isSelected={selectedParcoursId === p.id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && parcours.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-gray-500 text-center">
                Aucun parcours disponible pour le moment.
              </p>
              <Button
                onClick={() => navigate({ to: '/' })}
                variant="outline"
              >
                Retour à l'accueil
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-[#EAF9EA] px-4 pb-6 pt-4">
        <Button
          type="button"
          disabled={!selectedParcoursId}
          className="w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => selectedParcoursId && handleStartParcours(selectedParcoursId)}
        >
          Continuer
        </Button>
      </div>
    </div>
  )
}