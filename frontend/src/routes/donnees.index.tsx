import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Fragment, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockCarbonQuiz } from '@/data/mockCarbonQuiz'
import {
  cycleDevQuizDuMoisEtatOverride,
  formatDateProchainQuizFrMock,
  getDevQuizDuMoisEtatOverride,
  getQuizDuMoisEtatResolu,
  labelDevQuizDuMoisOverrideCourant,
  libelleTempsRestantAvantOuvertureMock,
} from '@/lib/quiz-du-mois-etat'
import type { ApiError } from '@/api/client'
import { UsersService } from '@/api/client'
import { MonthlyQuizService } from '@/api/client/services/MonthlyQuizService'
import { AUTH_ME_QUERY_KEY } from '@/api/hooks/useAuth'
import {
  MONTHLY_QUIZ_CURRENT_QUERY_KEY,
  useMonthlyQuizCurrent,
} from '@/api/hooks/useMonthlyQuizCurrent'
import { ONBOARDING_QUIZ_RESULT_QUERY_KEY } from '@/api/hooks/useOnboardingQuizResult'
import { useAuth } from '@/auth/AuthContext'
import {
  CalendarClock,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  PlayCircle,
  RotateCcw,
  Wrench,
} from 'lucide-react'
import BottomNav from '@/components/home/BottomNav'

export const Route = createFileRoute('/donnees/')({
  component: DonneesIndexPage,
})

function messageReinitialisationOnboarding(error: unknown): string {
  const e = error as ApiError | undefined
  const msg = e?.body?.message
  if (typeof msg === 'string' && msg.trim()) return msg
  if (e?.status === 401) return 'Session expirée ou non authentifié. Reconnectez-vous.'
  if (e?.status === 404) return 'Service introuvable. Vérifiez que l’API est à jour (endpoint reset).'
  return 'Échec de la réinitialisation. Réessayez.'
}

function messageSimulateNextMonthDev(error: unknown): string {
  const e = error as ApiError | undefined
  if (e?.status === 403)
    return 'Indisponible : l’API tourne en production (NODE_ENV).'
  const msg = e?.body?.message
  if (typeof msg === 'string' && msg.trim()) return msg
  if (e?.status === 401) return 'Session expirée. Reconnectez-vous.'
  if (e?.status === 400)
    return 'Rien à simuler pour ce mois UTC (aucun score ni verrou sur le mois courant).'
  return 'Échec de la simulation. Réessayez.'
}

function formatIsoDateLongFr(iso: string | null | undefined): string | null {
  if (!iso || typeof iso !== 'string') return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return null
  }
}

/** Prochaine ouverture dans le futur et à moins de 7 jours → période « en attente », sans lancement du quiz. */
function isNextQuizOpeningWithinOneWeek(nextIso: string | null | undefined): boolean {
  if (!nextIso || typeof nextIso !== 'string') return false
  const t = new Date(nextIso).getTime()
  if (Number.isNaN(t)) return false
  const now = Date.now()
  if (t <= now) return false
  return t - now < 7 * 24 * 60 * 60 * 1000
}

function detailEnAttenteOuvertureProchaine(nextIso: string | null | undefined): string {
  const dateLong = formatIsoDateLongFr(nextIso)
  if (!nextIso) {
    return 'Le quiz du mois sera bientôt disponible. Revenez dans les prochains jours.'
  }
  const t = new Date(nextIso).getTime()
  const days = Math.max(1, Math.ceil((t - Date.now()) / (24 * 60 * 60 * 1000)))
  const datePart = dateLong ? `Ouverture prévue : ${dateLong}.` : ''
  return `${datePart} Encore environ ${days} jour${days > 1 ? 's' : ''} — le quiz n’est pas encore lançable. Revenez très bientôt.`
}

function detailDonneesStaleSousQuizOuvert(
  lastScoreHistoryAt: string | null,
): string {
  const lastFmt = formatIsoDateLongFr(lastScoreHistoryAt)
  return [
    lastFmt ? `Dernières données : ${lastFmt}.` : null,
  ]
    .filter(Boolean)
    .join(' ')
}

type QuizDuMoisEtat = 'a_faire' | 'bientot' | 'deja_fait'

type DonneesQuizPresentation = {
  quizDuMoisEtat: QuizDuMoisEtat
  statusStepIndex: number
  statusHeadline: string
  statusDetail: string
  showStartButton: boolean
}

function DonneesIndexPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isOnboardingCompleted, refreshAuth } = useAuth()
  const [quizEtatTick, setQuizEtatTick] = useState(0)
  const [devActionsOpen, setDevActionsOpen] = useState(false)

  const resetOnboardingMutation = useMutation({
    mutationFn: () =>
      UsersService.userControllerResetOnboardingForRetest({ requestBody: {} }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ONBOARDING_QUIZ_RESULT_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: MONTHLY_QUIZ_CURRENT_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
      await refreshAuth()
      void navigate({ to: '/onboarding/quiz' })
    },
  })

  const [devSimulateLastOk, setDevSimulateLastOk] = useState<string | null>(null)

  const simulateNextMonthDevMutation = useMutation({
    mutationFn: () => MonthlyQuizService.monthlyQuizControllerDevSimulateNextMonth(),
    onMutate: () => setDevSimulateLastOk(null),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: MONTHLY_QUIZ_CURRENT_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ONBOARDING_QUIZ_RESULT_QUERY_KEY })
      setDevSimulateLastOk(
        `Déplacé : ${data.scoreRowsShifted ?? 0} score(s), ${data.monthlyQuizzesUpdated ?? 0} ligne(s) monthly_quizzes.`,
      )
    },
  })

  const monthlyQuery = useMonthlyQuizCurrent(Boolean(isOnboardingCompleted))

  const presentation = useMemo((): DonneesQuizPresentation => {
    const devOverride = import.meta.env.DEV ? getDevQuizDuMoisEtatOverride() : null

    if (devOverride !== null) {
      const etat = devOverride
      return {
        quizDuMoisEtat: etat,
        statusStepIndex: etat === 'bientot' ? 0 : etat === 'a_faire' ? 1 : 2,
        statusHeadline:
          etat === 'a_faire'
            ? 'Quiz ouvert'
            : etat === 'bientot'
              ? 'Ouverture prochaine'
              : 'Quiz enregistré',
        statusDetail:
          etat === 'a_faire'
            ? mockCarbonQuiz.encouragementQuizOuvert
            : etat === 'bientot'
              ? libelleTempsRestantAvantOuvertureMock()
              : `Prochain quiz : ${formatDateProchainQuizFrMock()}.`,
        showStartButton: etat === 'a_faire' && Boolean(isOnboardingCompleted),
      }
    }

    if (!isOnboardingCompleted) {
      const etat = getQuizDuMoisEtatResolu()
      return {
        quizDuMoisEtat: etat,
        statusStepIndex: etat === 'bientot' ? 0 : etat === 'a_faire' ? 1 : 2,
        statusHeadline:
          etat === 'a_faire'
            ? 'Quiz ouvert'
            : etat === 'bientot'
              ? 'Ouverture prochaine'
              : 'Quiz enregistré',
        statusDetail:
          etat === 'a_faire'
            ? mockCarbonQuiz.encouragementQuizOuvert
            : etat === 'bientot'
              ? libelleTempsRestantAvantOuvertureMock()
              : `Prochain quiz : ${formatDateProchainQuizFrMock()}.`,
        showStartButton: false,
      }
    }

    if (monthlyQuery.isError) {
      return {
        quizDuMoisEtat: 'deja_fait',
        statusStepIndex: 2,
        statusHeadline: 'Service indisponible',
        statusDetail:
          'Impossible de charger le quiz du mois. Vérifiez votre connexion ou réessayez plus tard.',
        showStartButton: false,
      }
    }

    if (monthlyQuery.isLoading || !monthlyQuery.data) {
      return {
        quizDuMoisEtat: 'a_faire',
        statusStepIndex: 1,
        statusHeadline: 'Chargement…',
        statusDetail: 'Récupération de votre quiz du mois.',
        showStartButton: false,
      }
    }

    const api = monthlyQuery.data
    const open = api.quiz !== null
    const stale = api.dataFreshness === 'stale'

    if (!open) {
      if (isNextQuizOpeningWithinOneWeek(api.nextMonthlyQuizAt)) {
        return {
          quizDuMoisEtat: 'bientot',
          statusStepIndex: 0,
          statusHeadline: 'Ouverture prochaine',
          statusDetail: detailEnAttenteOuvertureProchaine(api.nextMonthlyQuizAt),
          showStartButton: false,
        }
      }
      const nextFmt = formatIsoDateLongFr(api.nextMonthlyQuizAt)
      return {
        quizDuMoisEtat: 'deja_fait',
        statusStepIndex: 2,
        statusHeadline: 'Quiz enregistré',
        statusDetail: nextFmt
          ? `Enregistrement à jour pour ce mois. Prochaine ouverture prévue : ${nextFmt}.`
          : 'Enregistrement à jour pour ce mois. Vous serez invité à refaire le quiz au prochain cycle.',
        showStartButton: false,
      }
    }

    const recentCopy =
      api.dataFreshness === 'recent'
        ? `Vos données sont récentes — vous pouvez affiner votre bilan.`
        : mockCarbonQuiz.encouragementQuizOuvert

    const openDetail = stale
      ? `${detailDonneesStaleSousQuizOuvert(api.lastScoreHistoryAt)}`
      : recentCopy

    return {
      quizDuMoisEtat: 'a_faire',
      statusStepIndex: 1,
      statusHeadline: 'Quiz ouvert',
      statusDetail: openDetail,
      showStartButton: true,
    }
  }, [
    isOnboardingCompleted,
    monthlyQuery.data,
    monthlyQuery.isError,
    monthlyQuery.isLoading,
    quizEtatTick,
  ])

  const { quizDuMoisEtat, statusStepIndex, statusHeadline, statusDetail, showStartButton } =
    presentation

  const handleStartQuiz = () => {
    if (!showStartButton) return
    void navigate({ to: '/carbon-quiz-questions', search: { source: 'monthly' } })
  }

  const handleCycleQuizDuMoisDev = () => {
    cycleDevQuizDuMoisEtatOverride()
    setQuizEtatTick((n) => n + 1)
  }

  const handleResetOnboardingTemp = () => {
    const ok = window.confirm(
      "Réinitialiser l'onboarding ? Tous les scores enregistrés en base (bilan d'onboarding et quiz du mois) seront supprimés. Action prévue pour les tests.",
    )
    if (!ok) return
    resetOnboardingMutation.mutate()
  }

  const handleSimulateNextMonthDev = () => {
    const ok = window.confirm(
      'Simuler le passage au mois suivant (DEV) ? Les entrées score_history du mois UTC courant seront recopiées sur le mois précédent puis supprimées pour ce mois ; idem pour les dates monthly_quizzes concernées ; le verrou mensuel sera recalé sur le mois précédent.',
    )
    if (!ok) return
    simulateNextMonthDevMutation.mutate()
  }

  const showFloatingDevTools = import.meta.env.DEV || isOnboardingCompleted

  const cycleSteps = [
    { key: 'wait', label: 'Attente' },
    { key: 'open', label: 'Ouvert' },
    { key: 'done', label: 'Fait' },
  ] as const

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]">
      {showFloatingDevTools ? (
        <div className="pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-50 sm:right-4 sm:top-[calc(env(safe-area-inset-top,0px)+3.5rem)]">
          <div className="pointer-events-auto flex max-w-[calc(100vw-1rem)] flex-col-reverse items-end gap-1.5">
            <button
              type="button"
              onClick={() => setDevActionsOpen((o) => !o)}
              aria-expanded={devActionsOpen}
              aria-controls="donnees-dev-actions-panel"
              title={devActionsOpen ? 'Masquer les outils de test' : 'Outils de test (dev)'}
              className={cn(
                'flex size-8 items-center justify-center rounded-full border border-slate-300/50 bg-white/70 text-slate-500 shadow-sm backdrop-blur-sm transition-colors',
                'hover:border-slate-400 hover:bg-white/90 hover:text-slate-700',
                devActionsOpen && 'border-slate-500/40 bg-white text-slate-800 ring-1 ring-slate-400/25',
              )}
            >
              <Wrench className="size-3.5" aria-hidden />
              <span className="sr-only">Outils de développement et tests</span>
            </button>
            {devActionsOpen ? (
              <div
                id="donnees-dev-actions-panel"
                className="flex max-w-[min(100%,17rem)] flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)] ring-1 ring-black/5 backdrop-blur-md"
              >
                {import.meta.env.DEV ? (
                  <div className="rounded-xl border border-violet-200/80 bg-violet-50/90 px-2 py-2">
                    <p className="text-center text-[9px] font-semibold uppercase tracking-wide text-violet-900/85">
                      Dev — quiz du mois
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-center text-[10px] leading-tight text-violet-950/85">
                      {labelDevQuizDuMoisOverrideCourant()}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCycleQuizDuMoisDev}
                      className="mt-1.5 h-8 w-full border-violet-400/50 px-2 text-[11px] text-violet-950 hover:bg-violet-100/80"
                    >
                      Cycle état
                    </Button>
                    {isOnboardingCompleted ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={simulateNextMonthDevMutation.isPending}
                          onClick={handleSimulateNextMonthDev}
                          className="mt-1.5 h-8 w-full border-violet-500/55 px-2 text-[11px] text-violet-950 hover:bg-violet-100/80"
                        >
                          <CalendarRange
                            className={cn(
                              'mr-1 size-3.5 shrink-0',
                              simulateNextMonthDevMutation.isPending && 'animate-pulse',
                            )}
                            aria-hidden
                          />
                          Simuler mois suivant (API)
                        </Button>
                        {simulateNextMonthDevMutation.isError ? (
                          <p className="mt-1.5 text-center text-[10px] leading-snug text-red-600">
                            {messageSimulateNextMonthDev(simulateNextMonthDevMutation.error)}
                          </p>
                        ) : null}
                        {devSimulateLastOk ? (
                          <p className="mt-1.5 text-center text-[10px] leading-snug text-emerald-800">
                            {devSimulateLastOk}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                ) : null}
                {isOnboardingCompleted ? (
                  <div className="rounded-xl border border-dashed border-amber-300/90 bg-amber-50/90 px-2 py-2">
                    <p className="text-center text-[9px] font-semibold uppercase tracking-wide text-amber-900/85">
                      Tests
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resetOnboardingMutation.isPending}
                      onClick={handleResetOnboardingTemp}
                      className="mt-1.5 h-8 w-full border-amber-700/40 px-2 text-[11px] text-amber-950 hover:bg-amber-50"
                    >
                      <RotateCcw
                        className={cn(
                          'size-3.5 shrink-0',
                          resetOnboardingMutation.isPending && 'animate-spin',
                        )}
                        aria-hidden
                      />
                      Refaire onboarding
                    </Button>
                    {resetOnboardingMutation.isError ? (
                      <p className="mt-1.5 text-center text-[10px] leading-snug text-red-600">
                        {messageReinitialisationOnboarding(resetOnboardingMutation.error)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-3 pt-0.5 sm:px-4 sm:pt-1">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] bg-white',
            'shadow-[0_22px_48px_-18px_rgba(26,77,62,0.28),0_8px_24px_-12px_rgba(15,40,30,0.12)]',
            'ring-1 ring-slate-900/4',
          )}
        >
          {/* Occupe tout l’espace au-dessus du bloc contenu (plus le milieu est haut, moins l’image est haute). */}
          <section
            className="relative isolate min-h-0 flex-1 basis-0 overflow-hidden rounded-t-[1.75rem] bg-slate-200/40"
            style={{
              backgroundImage: `url(${mockCarbonQuiz.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 42%',
            }}
            aria-hidden
          >
            <div
              className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white"
              aria-hidden
            />
          </section>

          <div className="shrink-0 rounded-b-[1.75rem] bg-white">
            <div className="flex flex-col gap-2 px-4 pt-2.5 pb-2 sm:gap-5 sm:px-6 sm:pt-5 sm:pb-4">
              <header className="flex items-start justify-between gap-3 sm:gap-4">
                <h1 className="min-w-0 flex-1 text-balance text-xl font-bold leading-tight tracking-tight text-[#1b3d32] sm:text-[1.65rem] sm:leading-[1.12]">
                  {mockCarbonQuiz.title}
                </h1>
                <div
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-[#1A4D3E]/12',
                    'bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold text-[#1A4D3E] sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs',
                  )}
                >
                  <Clock className="size-3 shrink-0 opacity-80 sm:size-3.5" aria-hidden />
                  Environ {mockCarbonQuiz.estimatedMinutes}
                </div>
              </header>

              <div
                role="status"
                aria-live="polite"
                className="shrink-0 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:rounded-2xl sm:p-5"
              >
                <div className="flex gap-2.5 sm:gap-4">
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg shadow-inner sm:size-12 sm:rounded-xl',
                      quizDuMoisEtat === 'a_faire' &&
                      'bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-900/15',
                      quizDuMoisEtat === 'bientot' &&
                      'bg-linear-to-br from-amber-400 to-amber-600 text-white shadow-amber-900/15',
                      quizDuMoisEtat === 'deja_fait' &&
                      'bg-linear-to-br from-slate-400 to-slate-600 text-white shadow-slate-900/10',
                    )}
                  >
                    {quizDuMoisEtat === 'a_faire' ? (
                      <PlayCircle className="size-5 sm:size-6" aria-hidden />
                    ) : quizDuMoisEtat === 'bientot' ? (
                      <CalendarClock className="size-5 sm:size-6" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-5 sm:size-6" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug tracking-tight text-[#1b3d32] sm:text-xl">
                      {statusHeadline}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs leading-snug text-slate-600 sm:mt-2 sm:line-clamp-none sm:text-sm sm:leading-relaxed">
                      {statusDetail}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 pb-3 pt-2.5 sm:px-6 sm:pb-5 sm:pt-4">
              <div className="space-y-2.5 sm:space-y-4" role="group" aria-label="Progression et action du quiz du mois">
                <div aria-label="Progression du cycle du quiz">
                  <p className="mb-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:mb-3 sm:text-[11px]">
                    Votre parcours ce mois-ci
                  </p>
                  <div className="flex w-full items-center px-0.5 sm:px-1">
                    {cycleSteps.map((step, i) => {
                      const active = i === statusStepIndex
                      const done = i < statusStepIndex
                      return (
                        <Fragment key={step.key}>
                          {i > 0 ? (
                            <div
                              className={cn(
                                'mx-1 h-1 min-w-3 flex-1 rounded-full transition-colors',
                                statusStepIndex >= i ? 'bg-emerald-500/85' : 'bg-slate-200',
                              )}
                              aria-hidden
                            />
                          ) : null}
                          <div className="flex w-[3.35rem] shrink-0 flex-col items-center gap-1 sm:w-16 sm:gap-2">
                            <div
                              className={cn(
                                'flex size-8 items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-all sm:size-9 sm:text-xs',
                                active &&
                                quizDuMoisEtat === 'a_faire' &&
                                'scale-105 bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/30',
                                active &&
                                quizDuMoisEtat === 'bientot' &&
                                'scale-105 bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/35',
                                active &&
                                quizDuMoisEtat === 'deja_fait' &&
                                'scale-105 bg-slate-600 text-white shadow-md shadow-slate-600/20 ring-2 ring-slate-400/25',
                                !active && done && 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/90',
                                !active && !done && 'bg-white text-slate-400 ring-1 ring-slate-200',
                              )}
                            >
                              {done ? <Check className="size-3.5 stroke-[2.5] sm:size-4" aria-hidden /> : i + 1}
                            </div>
                            <span
                              className={cn(
                                'w-full text-center text-[10px] font-medium leading-tight sm:text-[11px]',
                                active ? 'text-slate-800' : 'text-slate-400',
                              )}
                            >
                              {step.label}
                            </span>
                          </div>
                        </Fragment>
                      )
                    })}
                  </div>
                </div>

                <div>
                  {showStartButton ? (
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleStartQuiz}
                      className={cn(
                        'h-11 w-full rounded-xl border-0 bg-[#1A4D3E] text-sm font-semibold text-white sm:h-12 sm:text-[15px]',
                        'shadow-lg shadow-[#1A4D3E]/25 transition-[transform,box-shadow,background-color]',
                        'hover:bg-[#153936] hover:shadow-xl hover:shadow-[#1A4D3E]/30',
                        'active:scale-[0.98]',
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <PlayCircle className="size-5 shrink-0" aria-hidden />
                        Commencer le quiz
                      </span>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
