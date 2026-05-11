import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { useCommunityDetail } from '@/api/hooks/useCommunityDetail'
import { useAuth } from '@/auth/AuthContext'
import BottomNav from '@/components/home/BottomNav'
import { CommunityChallengeBanner } from '@/components/communities/CommunityChallengeBanner'
import { CommunityChat } from '@/components/communities/CommunityChat'
import { CommunitySuccessDialog } from '@/components/communities/CommunitySuccessDialog'
import { CommunityTreeRankingDialog } from '@/components/communities/CommunityTreeRankingDialog'
import { Button } from '@/components/ui/button'
import { displayNameFromUser } from '@/lib/displayName'

export const Route = createFileRoute('/communautes/$communityId')({
  component: CommunauteDetailPage,
})

function CommunauteDetailPage() {
  const { communityId } = Route.useParams()
  const { user } = useAuth()
  const { data: detail, isPending, isError } = useCommunityDetail(communityId)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [defiProgress, setDefiProgress] = useState<{
    membersCompleted: number
    userDone: boolean
  } | null>(null)
  const [showBurst, setShowBurst] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const celebrationShownRef = useRef(false)

  useEffect(() => {
    if (!detail?.active_defi) return
    setDefiProgress({
      membersCompleted: detail.active_defi.members_completed,
      userDone: detail.active_defi.current_user_completed,
    })
    celebrationShownRef.current = false
    setShowBurst(false)
    setSuccessOpen(false)
  }, [detail?.community.id, detail?.active_defi?.id])

  const handleMarkComplete = () => {
    if (!defiProgress || defiProgress.userDone || !detail?.active_defi) return
    const cap = detail.active_defi.members_total_for_challenge
    const prevCount = defiProgress.membersCompleted
    const nextCount = Math.min(cap, prevCount + 1)
    const becomesCollectiveSuccess = prevCount < cap && nextCount >= cap

    setDefiProgress({
      userDone: true,
      membersCompleted: nextCount,
    })

    if (becomesCollectiveSuccess && !celebrationShownRef.current) {
      celebrationShownRef.current = true
      setShowBurst(true)
      window.setTimeout(() => setSuccessOpen(true), 450)
      window.setTimeout(() => setShowBurst(false), 2400)
    }
  }

  const currentUserId = user?.id ?? 'anonymous'
  const chatDisplayName = displayNameFromUser(user)

  return (
    <div className="flex h-full min-h-0 max-h-full w-full flex-1 flex-col overflow-hidden bg-[#f1f8e9]">
      <div className="flex h-full min-h-0 max-h-full w-full min-w-0 flex-1 flex-col overflow-hidden px-3 pt-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:px-4">
        {(isPending || isError || (!isPending && !isError && detail === null)) && (
          <Button variant="ghost" size="sm" className="-ml-2 mb-3 w-fit shrink-0 text-[#1b5e20]" asChild>
            <Link to="/communautes">
              <ArrowLeft className="size-4" />
              Retour aux communautés
            </Link>
          </Button>
        )}

        {isPending && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white py-16 shadow-md">
            <Loader2 className="size-8 animate-spin text-[#1b5e20]" aria-hidden />
            <p className="text-sm text-gray-600">Chargement de la communauté…</p>
          </div>
        )}

        {isError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Impossible de charger cette communauté pour le moment.
          </p>
        )}

        {!isPending && !isError && detail === null && (
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

        {!isPending && detail && defiProgress && (
          <div className="flex min-h-0 min-w-0 max-h-full flex-1 basis-0 flex-col gap-2 overflow-hidden">
            <Button variant="ghost" size="sm" className="-ml-1 h-8 w-fit shrink-0 px-2 text-[#1b5e20]" asChild>
              <Link to="/communautes">
                <ArrowLeft className="size-4" />
                Retour aux communautés
              </Link>
            </Button>

            <div className="shrink-0">
              <CommunityChallengeBanner
                defi={detail.active_defi}
                membersCompleted={defiProgress.membersCompleted}
                currentUserCompleted={defiProgress.userDone}
                onMarkComplete={handleMarkComplete}
                showBonusBurst={showBurst}
              />
            </div>

            <CommunityChat
              communityId={detail.community.id}
              currentUserId={currentUserId}
              displayName={chatDisplayName}
              communityName={detail.community.name}
              winStreak={detail.win_streak}
              onOpenRanking={() => setRankingOpen(true)}
              className="min-h-0 min-w-0 w-full flex-1 basis-0 shadow-lg"
            />
          </div>
        )}
      </div>

      {!isPending && detail && defiProgress && (
        <>
          <CommunityTreeRankingDialog
            open={rankingOpen}
            onOpenChange={setRankingOpen}
            communityName={detail.community.name}
            entries={detail.tree_ranking}
          />

          <CommunitySuccessDialog
            open={successOpen}
            onOpenChange={setSuccessOpen}
            bonusFeuilles={detail.active_defi.bonus_feuilles}
          />
        </>
      )}

      <BottomNav />
    </div>
  )
}
