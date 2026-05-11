import { createFileRoute, Link, Outlet, useRouterState } from '@tanstack/react-router'

import { cn } from '@/lib/utils'

/**
 * Layout segment « Données » : menu (Quiz du mois / Votre score carbone) + `<Outlet />`.
 * Voir `donnees.index.tsx` (carte MAJ) et `donnees.bilan-onboarding.tsx`.
 */
export const Route = createFileRoute('/donnees')({
  component: DonneesLayout,
})

function DonneesSectionNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isQuizDuMois = pathname === '/donnees' || pathname === '/donnees/'
  const isScoreCarbone =
    pathname.startsWith('/donnees/bilan-onboarding') ||
    pathname.startsWith('/donnees/score/')

  return (
    <div className="shrink-0 bg-transparent px-3 pt-2 pb-1">
      <nav
        className="mx-auto flex max-w-md gap-1 rounded-2xl bg-white/55 p-1 shadow-sm ring-1 ring-[#1A4D3E]/6 backdrop-blur-md"
        aria-label="Sections mise à jour des données"
      >
        <Link
          to="/donnees"
          className={cn(
            'flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200',
            isQuizDuMois
              ? 'bg-[#1A4D3E] text-white shadow-md shadow-[#1A4D3E]/20'
              : 'text-[#1A4D3E]/85 hover:bg-white/70',
          )}
        >
          Quiz du mois
        </Link>
        <Link
          to="/donnees/bilan-onboarding"
          className={cn(
            'flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition-all duration-200',
            isScoreCarbone
              ? 'bg-[#1A4D3E] text-white shadow-md shadow-[#1A4D3E]/20'
              : 'text-[#1A4D3E]/85 hover:bg-white/70',
          )}
        >
          Votre score carbone
        </Link>
      </nav>
    </div>
  )
}

function DonneesLayout() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-transparent">
      <DonneesSectionNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden overscroll-y-none">
        <Outlet />
      </div>
    </div>
  )
}
