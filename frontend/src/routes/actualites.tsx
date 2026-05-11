import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'
import BottomNav from '@/components/home/BottomNav'

export const Route = createFileRoute('/actualites')({
  component: ActualitesPage,
})

function ActualitesPage() {
  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f1f8e9] w-full px-4 py-8 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 pb-20 text-[#1b5e20]">
        <FileText className="h-12 w-12 opacity-40" />
        <p className="text-lg font-medium opacity-60">Actualités — bientôt disponible</p>
      </div>
      <BottomNav />
    </div>
  )
}
