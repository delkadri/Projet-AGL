import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

import type { ApiError } from '@/api/client'
import { useScoreHistoryDetail } from '@/api/hooks/useScoreHistoryDetail'
import { getAuthErrorMessage } from '@/api/hooks/useAuth'
import BottomNav from '@/components/home/BottomNav'
import { QuizResult, type QuizCalculateScoreResponse } from '@/components/quiz/QuizResult'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/donnees/score/$id')({
  component: DonneesScoreDetailPage,
})

function formatMonthLong(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return ''
  }
}

function DonneesScoreDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useScoreHistoryDetail(id)

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 overflow-y-auto bg-[#f1f8e9] px-4 pb-24">
        <p className="text-center text-[#1b5e20]">Chargement du bilan…</p>
        <BottomNav />
      </div>
    )
  }

  if (isError || !data) {
    const apiErr = error as ApiError | undefined
    const message =
      apiErr?.status === 404
        ? 'Bilan introuvable ou inaccessible.'
        : getAuthErrorMessage(error)

    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-[#f1f8e9] px-4 pb-24">
        <p className="max-w-sm text-center text-red-700">{message}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Réessayer
          </Button>
          <Button type="button" asChild variant="default" className="bg-[#1A4D3E] hover:bg-[#153936]">
            <Link to="/donnees/bilan-onboarding">Retour à mon score</Link>
          </Button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const { savedAt, scoreHistoryId: _hid, ...resultRest } = data
  const result = resultRest as QuizCalculateScoreResponse
  const monthLabel = formatMonthLong(savedAt)

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-[#f1f8e9] pb-20">
      <div className="sticky top-0 z-10 -mb-2 bg-linear-to-b from-[#f1f8e9] via-[#f1f8e9]/95 to-transparent px-4 pt-2 pb-3 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => void navigate({ to: '/donnees/bilan-onboarding' })}
            aria-label="Retour à mon score"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#1A4D3E]/15 bg-white text-[#1A4D3E] shadow-sm transition-transform active:scale-95 hover:bg-emerald-50"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          {monthLabel ? (
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A4D3E]/70">
                Bilan
              </p>
              <p className="truncate text-sm font-bold capitalize text-[#1b3d32]">
                {monthLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <QuizResult
        result={result}
        finishAction={{ label: 'Retour à mon score', to: '/donnees/bilan-onboarding' }}
        history={[
          {
            at: savedAt,
            totalKgCo2ePerYear: result.score.totalKgCo2ePerYear,
          },
        ]}
      />
      <BottomNav />
    </div>
  )
}
