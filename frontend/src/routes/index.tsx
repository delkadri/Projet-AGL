import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  BottomNav,
  CarbonScoreCard,
  ChallengesCard,
  CommunityCard,
} from '@/components/home'

export function getStoredUser() {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      user?: { onboardingCompleted?: boolean }
      accessToken?: string
    }
    if (!parsed.user || !parsed.accessToken) return null
    return parsed.user
  } catch {
    return null
  }
}

export const Route = createFileRoute('/')({
  component: HomePage,
  beforeLoad: () => {
    const user = getStoredUser()

    if (!user) {
      throw redirect({ to: '/login' })
    }

    const onboardingCompleted = !!user.onboardingCompleted

    if (onboardingCompleted) {
      throw redirect({ to: '/' })
    }

    throw redirect({ to: '/onboarding/quiz' })
  },
})

function HomePage() {
  return (
    <div className="min-h-screen bg-[#f1f8e9]">
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
