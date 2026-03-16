import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { mockCarbonQuiz } from '@/data/mockCarbonQuiz'
import { Clock } from 'lucide-react'
import BottomNav from '@/components/home/BottomNav'

export const Route = createFileRoute('/donnees')({
  component: DonneesPage,
})

function DonneesPage() {
  const navigate = useNavigate()

  const handleStartQuiz = () => {
    // TODO: Implement API call to fetch carbon quiz data
    // TODO: Initialize quiz state and redirect to quiz questions
    navigate({ to: '/carbon-quiz-questions' })
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#f1f8e9] w-full px-4 py-8 flex flex-col">
      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="w-full max-w-sm">
          {/* Card Container */}
          <div className="rounded-2xl bg-white shadow-lg overflow-hidden">
            {/* Content Section - Title First */}
            <div className="p-6 pb-0">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 text-center">
                  {mockCarbonQuiz.title}
                </h1>
              </div>
            </div>

            {/* Image Section */}
            <div className="w-full h-96 flex items-center justify-center p-4 rounded-xl">
              <img
                src={mockCarbonQuiz.imageUrl}
                alt="Planet"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Content Section */}
            <div className="p-6 space-y-5">

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                {mockCarbonQuiz.description}
              </p>

              {/* Duration */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Clock className="w-5 h-5" style={{ color: '#1A4D3E' }} />
                <b><span>Durée : {mockCarbonQuiz.estimatedMinutes}</span></b>
              </div>

              {/* Button */}
              <Button
                onClick={handleStartQuiz}
                className="w-full bg-[#1A4D3E] hover:bg-[#153936] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {mockCarbonQuiz.buttonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
