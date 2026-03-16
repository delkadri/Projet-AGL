import { createFileRoute } from '@tanstack/react-router'
import {
  BottomNav,
  CarbonScoreCard,
  ChallengesCard,
  CommunityCard,
} from '@/components/home'

export const Route = createFileRoute('/')({
  component: HomePage,
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
