import { createFileRoute } from '@tanstack/react-router'
import { CarbonBilanContainer } from '@/components/carbon/CarbonBilanContainer'

export const Route = createFileRoute('/carbon-quiz-results')({
  component: CarbonQuizResultsPage,
})

function CarbonQuizResultsPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-green-50 to-blue-50">
      <CarbonBilanContainer />
    </div>
  )
}
