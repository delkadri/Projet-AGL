import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Users } from 'lucide-react'

import BottomNav from '@/components/home/BottomNav'
import { Button } from '@/components/ui/button'
import { getMockCommunityById } from '@/data/mockCommunities'

export const Route = createFileRoute('/communautes/$communityId')({
  component: CommunauteDetailPage,
})

function CommunauteDetailPage() {
  const { communityId } = Route.useParams()
  const community = getMockCommunityById(communityId)

  return (
    <div className="min-h-[calc(100vh-70px)] w-full bg-[#f1f8e9] px-4 pb-24 pt-4">
      <div className="mx-auto max-w-md">
        <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-[#1b5e20]" asChild>
          <Link to="/communautes">
            <ArrowLeft className="size-4" />
            Retour aux communautés
          </Link>
        </Button>

        {community ? (
          <article className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#e8f5e9] text-[#1b5e20]">
              <Users className="size-6" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
            <p className="mt-1 text-sm text-gray-500">/{community.slug}</p>
            <p className="mt-4 text-sm leading-relaxed text-gray-700">{community.description}</p>
            <p className="mt-4 text-sm text-gray-600">
              <span className="font-medium text-gray-800">{community.member_count}</span> membre
              {community.member_count > 1 ? 's' : ''}
            </p>

            <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center">
              <p className="text-sm font-medium text-gray-800">Page communauté</p>
              <p className="mt-1 text-xs text-gray-600">
                Contenu à venir : fil d’actualité, défis du groupe, classement…
              </p>
              <Button
                type="button"
                className="mt-4 bg-[#1b5e20] text-white hover:bg-[#2e7d32]"
                onClick={() => {
                  /* TODO: actions groupe (chat, défis, etc.) */
                }}
              >
                Action à brancher plus tard
              </Button>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <p className="text-sm font-medium text-gray-900">Communauté introuvable</p>
            <p className="mt-2 text-xs text-gray-600">
              Cet identifiant ne correspond à aucune communauté de démonstration.
            </p>
            <Button className="mt-6 bg-[#1b5e20] text-white hover:bg-[#2e7d32]" asChild>
              <Link to="/communautes">Voir mes communautés</Link>
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
