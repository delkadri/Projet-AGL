import { createFileRoute } from '@tanstack/react-router'
import BottomNav from '@/components/home/BottomNav'
import { ObjectivesList } from '@/components/challenges'

export const Route = createFileRoute('/objectifs')({
  component: ObjectifsPage,
})

function ObjectifsPage() {
  return (
    <div className="min-h-screen bg-[#EAF9EA]">
      <ObjectivesList />
      <BottomNav />
    </div>
  )
}
