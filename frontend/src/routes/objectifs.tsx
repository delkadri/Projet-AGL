import { createFileRoute } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import BottomNav from '@/components/home/BottomNav'

export const Route = createFileRoute('/objectifs')({
  component: ObjectifsPage,
})

function ObjectifsPage() {
  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f1f8e9] w-full px-4 py-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20 text-[#1b5e20]">
        <BarChart3 className="h-12 w-12 opacity-40" />
        <p className="text-lg font-medium opacity-60">Objectifs — bientôt disponible</p>
      </div>
      <BottomNav />
    </div>
  )
}
