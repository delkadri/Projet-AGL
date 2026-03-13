import { createFileRoute } from '@tanstack/react-router'
import { ParcoursList } from '@/components/parcours'

export const Route = createFileRoute('/parcours')({
  component: ParcoursPage,
})

function ParcoursPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#EAF9EA]">
      <ParcoursList />
    </div>
  )
}