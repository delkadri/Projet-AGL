import type { ReactNode } from 'react'
import type { Parcours } from '@/types/parcours'
import { ParcoursCard } from './ParcoursCard'
export type ParcoursListProps = {
  /** Id du parcours sélectionné (contrôlé par le parent). */
  selectedParcoursId: string | null
  /** Appelé quand l'utilisateur sélectionne un parcours. */
  onSelectParcours: (parcoursId: string) => void
  /** Liste des parcours (fournie par useParcours ou autre source). */
  parcours: Parcours[]
  /** Affiche un état de chargement. */
  isLoading?: boolean
  /** Message d'erreur optionnel (affiché à la place de la liste en cas d'erreur). */
  error?: string | null
  /** Contenu optionnel affiché dans l'état vide (ex: bouton Retour). */
  emptyStateAction?: ReactNode
}

export function ParcoursList({
  selectedParcoursId,
  onSelectParcours,
  parcours,
  isLoading = false,
  error = null,
  emptyStateAction,
}: ParcoursListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-6 pb-24">
      <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden">
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
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Chargement des parcours...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-center text-red-600">{error}</p>
              {emptyStateAction}
            </div>
          )}

          {!isLoading && !error && parcours.length > 0 && (
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {parcours.map((p) => (
                <ParcoursCard
                  key={p.id}
                  parcours={p}
                  onSelect={onSelectParcours}
                  isSelected={selectedParcoursId === p.id}
                />
              ))}
            </div>
          )}

          {!isLoading && !error && parcours.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <p className="text-gray-500 text-center">
                Aucun parcours disponible pour le moment.
              </p>
              {emptyStateAction}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}