import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  BottomNav,
  CarbonScoreCard,
  ChallengesCard,
  CommunityCard,
} from '@/components/home'
import { readStoredAuthUser } from '@/lib/stored-auth-user'

export const Route = createFileRoute('/')({
  component: HomePage,
  beforeLoad: () => {
    const user = readStoredAuthUser()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    const onboardingCompleted = !!user.onboardingCompleted
    if (!onboardingCompleted) {
      const hasBilan = !!user.hasOnboardingBilan
      throw redirect({ to: hasBilan ? '/onboarding/parcours' : '/onboarding/quiz' })
    }
    // Sinon on reste sur / et on affiche la page home
  },
})

function HomePage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-[#f1f8e9]">
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">
        <section className="flex flex-col gap-4">
          <ChallengesCard />
          <CarbonScoreCard />
          <CommunityCard />
        </section>
      </main>
      <BottomNav />
    </div>
  )
}
