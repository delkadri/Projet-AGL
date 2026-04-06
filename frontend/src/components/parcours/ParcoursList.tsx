import type { ReactNode } from 'react'
import type { Parcours } from '@/types/parcours'
import { ParcoursCard } from './ParcoursCard'

type DetailTheme = {
  bar: string
  badgePrimary: string
  badgeSecondary: string
}

function getDetailTheme(slug: string): DetailTheme {
  switch (slug) {
    case 'decouverte':
      return {
        bar: 'bg-[#5d8c3e]',
        badgePrimary: 'bg-[#5d8c3e]/15 text-[#3d6228]',
        badgeSecondary: 'bg-slate-100 text-slate-600',
      }
    case 'progression':
      return {
        bar: 'bg-[#3d6228]',
        badgePrimary: 'bg-[#3d6228]/15 text-[#2a4a1c]',
        badgeSecondary: 'bg-slate-100 text-slate-600',
      }
    case 'challenge':
      return {
        bar: 'bg-[#2f6b3f]',
        badgePrimary: 'bg-[#2f6b3f]/15 text-[#1e4d2b]',
        badgeSecondary: 'bg-slate-100 text-slate-600',
      }
    default:
      return {
        bar: 'bg-slate-400',
        badgePrimary: 'bg-slate-100 text-slate-600',
        badgeSecondary: 'bg-slate-100 text-slate-600',
      }
  }
}

export type ParcoursListProps = {
  selectedParcoursId: string | null
  onSelectParcours: (parcoursId: string) => void
  parcours: Parcours[]
  isLoading?: boolean
  error?: string | null
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
  const selected = parcours.find((p) => p.id === selectedParcoursId) ?? null

  return (
    <div className="flex flex-1 flex-col px-5 pb-28 pt-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[#5d8c3e]">
          Bienvenue
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A4D3E]">Votre parcours</h1>
        <p className="mt-1.5 text-sm text-slate-500">Choisissez celui qui vous correspond</p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-400">Chargement…</p>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-center text-red-500">{error}</p>
          {emptyStateAction}
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {parcours.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <p className="text-center text-slate-400">
                Aucun parcours disponible pour le moment.
              </p>
              {emptyStateAction}
            </div>
          ) : (
            <>
              {/* Thumbnail row */}
              <div className="flex justify-evenly px-2">
                {parcours.map((p) => (
                  <ParcoursCard
                    key={p.id}
                    parcours={p}
                    onSelect={onSelectParcours}
                    isSelected={selectedParcoursId === p.id}
                  />
                ))}
              </div>

              {/* Detail panel */}
              {selected && (
                <div
                  key={selected.id}
                  className="animate-in fade-in slide-in-from-bottom-3 mt-8 overflow-hidden rounded-2xl bg-white shadow-lg duration-300"
                >
                  <div className={`h-1 w-full ${getDetailTheme(selected.slug).bar}`} />

                  <div className="p-5">
                    <h2 className="text-xl font-bold text-[#1A4D3E]">{selected.name}</h2>

                    {selected.frequency && (
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getDetailTheme(selected.slug).badgePrimary}`}
                        >
                          {selected.frequency.defis}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getDetailTheme(selected.slug).badgeSecondary}`}
                        >
                          {selected.frequency.quizz}
                        </span>
                      </div>
                    )}

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {selected.summary ?? selected.description}
                    </p>

                    <p className="mt-4 text-[11px] text-slate-400">
                      Le choix de parcours n&apos;est pas définitif — vous pourrez en changer à tout
                      moment.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
