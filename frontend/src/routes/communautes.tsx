import { createFileRoute, Link } from '@tanstack/react-router'
import { ChevronRight, Plus, Target, UserPlus, Users } from 'lucide-react'

import { useUserCommunities } from '@/api/hooks/useUserCommunities'
import BottomNav from '@/components/home/BottomNav'
import { Button } from '@/components/ui/button'
export const Route = createFileRoute('/communautes')({
  component: CommunautesPage,
})

function CommunautesPage() {
  const { data: memberships, isPending, isError } = useUserCommunities()

  return (
    <div className="min-h-[calc(100vh-70px)] w-full bg-[#f1f8e9] px-4 pb-24 pt-4">
      <div className="mx-auto max-w-md">
        <header className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Communautés</h1>
        </header>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full border-[#1b5e20]/40 bg-white text-[#1b5e20] hover:bg-[#e8f5e9]"
            onClick={() => {
              /* TODO: flux rejoindre une communauté */
            }}
          >
            <UserPlus className="size-4" />
            Rejoindre une communauté
          </Button>
          <Button
            type="button"
            className="h-11 w-full bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
            onClick={() => {
              /* TODO: flux créer une communauté */
            }}
          >
            <Plus className="size-4" />
            Créer une communauté
          </Button>
        </div>

        <section aria-labelledby="communities-list-heading">
          <h2 id="communities-list-heading" className="sr-only">
            Mes communautés
          </h2>

          {isPending && <CommunitiesListSkeleton />}

          {isError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Impossible de charger la liste pour le moment. Réessayez plus tard.
            </p>
          )}

          {!isPending && !isError && memberships && memberships.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#1b5e20]/30 bg-white/80 px-4 py-8 text-center">
              <Users className="mx-auto mb-2 size-10 text-[#1b5e20]/60" aria-hidden />
              <p className="text-sm font-medium text-gray-800">Aucune communauté pour l’instant</p>
              <p className="mt-1 text-xs text-gray-600">
                Rejoignez ou créez un groupe pour commencer.
              </p>
            </div>
          )}

          {!isPending && !isError && memberships && memberships.length > 0 && (
            <ul className="flex flex-col gap-3">
              {memberships.map(({ community, has_pending_defi }) => (
                <li key={community.id}>
                  <Link
                    to="/communautes/$communityId"
                    params={{ communityId: community.id }}
                    className="block rounded-2xl bg-white p-4 shadow-md outline-none ring-[#1b5e20] transition-shadow hover:shadow-lg focus-visible:ring-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-semibold text-gray-900">
                            {community.name}
                          </span>
                          {has_pending_defi && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-600/70 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-900">
                              <Target className="size-3.5 shrink-0 text-red-700" aria-hidden />
                              Défi à faire
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                          {community.description}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {community.member_count} membre{community.member_count > 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight
                        className="mt-0.5 size-5 shrink-0 text-[#1b5e20]/70"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  )
}

function CommunitiesListSkeleton() {
  return (
    <ul className="flex flex-col gap-3" aria-hidden>
      {[1, 2, 3].map((i) => (
        <li
          key={i}
          className="h-28 animate-pulse rounded-2xl bg-white/90 shadow-md"
        />
      ))}
    </ul>
  )
}
