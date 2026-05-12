import { useCallback, useState } from 'react'
import { Target } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ApiError } from '@/api/client'
import { useCompleteSimpleDailyChallenge } from '@/api/hooks/useCompleteSimpleDailyChallenge'
import { AUTH_ME_QUERY_KEY, useCurrentUserQuery } from '@/api/hooks/useAuth'
import { ChallengeDetailContent } from '@/components/challenges/ChallengeDetailContent'
import { ChallengeDetailDialog } from '@/components/challenges/ChallengeDetailDialog'
import { LeafConfetti } from '@/components/home/LeafConfetti'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { HOME_DAILY_CHALLENGE } from '@/data/homeChallengeMock'
import { getUserFacingApiMessage } from '@/lib/api-user-message'
import { isSimpleChallengeCompletedTodayUtc } from '@/lib/simpleChallengeUtc'

export default function ChallengesCard() {
  const queryClient = useQueryClient()
  const { data: profile } = useCurrentUserQuery()
  const completeSimple = useCompleteSimpleDailyChallenge()
  const [detailOpen, setDetailOpen] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const doneToday = isSimpleChallengeCompletedTodayUtc(
    profile?.lastSimpleChallengeCompletedAt ?? null,
  )

  const handleChallengeAccepted = useCallback(async () => {
    try {
      await completeSimple.mutateAsync()
      setDetailOpen(false)
      setShowConfetti(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
        setDetailOpen(false)
        toast.info('Défi déjà enregistré pour aujourd’hui.')
        return
      }
      const msg =
        getUserFacingApiMessage(err) ??
        'Impossible d’enregistrer le défi. Réessayez dans un instant.'
      toast.error(msg)
    }
  }, [completeSimple, queryClient])

  const handleConfettiDone = useCallback(() => {
    setShowConfetti(false)
  }, [])

  return (
    <>
      <LeafConfetti active={showConfetti} onDone={handleConfettiDone} />

      <div className="rounded-2xl bg-[#c8e6c9] p-4 shadow-md">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold tracking-wide text-[#1b5e20] uppercase">
          <Target className="h-4 w-4" aria-hidden />
          Défis
        </h3>
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#a5d6a7]">
          <div className="h-full w-1/3 rounded-full bg-[#2e7d32]" />
        </div>
        {HOME_DAILY_CHALLENGE.weekProgressLabel && (
          <p className="mb-3 text-xs text-[#1b5e20]">{HOME_DAILY_CHALLENGE.weekProgressLabel}</p>
        )}
        <div className="rounded-2xl bg-[#a5d6a7] p-3">
          <div
            role="button"
            tabIndex={0}
            aria-label="Voir le détail du défi"
            className="cursor-pointer rounded-xl text-left transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[#1b5e20] focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={() => setDetailOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setDetailOpen(true)
              }
            }}
          >
            <ChallengeDetailContent challenge={HOME_DAILY_CHALLENGE} />
          </div>
          <Button
            type="button"
            className={cn(
              'mt-3 w-full',
              doneToday
                ? 'border border-[#2e7d32]/40 bg-white/90 text-[#1b5e20] hover:bg-[#e8f5e9]'
                : 'bg-[#2e7d32] text-white hover:bg-[#1b5e20]',
            )}
            size="sm"
            variant={doneToday ? 'outline' : 'default'}
            disabled={doneToday || completeSimple.isPending}
            onClick={() => setDetailOpen(true)}
          >
            {doneToday
              ? 'Défi relevé ✓'
              : completeSimple.isPending
                ? 'Enregistrement…'
                : "J'ai relevé le défi"}
          </Button>
        </div>
      </div>

      <ChallengeDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        challenge={HOME_DAILY_CHALLENGE}
        dialogTitle="Votre défi du jour"
        footer={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#2e7d32] text-[#1b5e20]"
              onClick={() => setDetailOpen(false)}
            >
              Fermer
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#2e7d32] text-white hover:bg-[#1b5e20]"
              disabled={doneToday || completeSimple.isPending}
              onClick={() => {
                void handleChallengeAccepted()
              }}
            >
              {doneToday
                ? 'Défi relevé ✓'
                : completeSimple.isPending
                  ? 'Enregistrement…'
                  : "J'ai relevé le défi"}
            </Button>
          </div>
        }
      />
    </>
  )
}
