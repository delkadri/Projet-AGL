import { mockCarbonScoreHistory, getNextQuizDate } from '@/data/mockCarbonScore'
import { CarbonScoreCircle } from './CarbonScoreCircle'
import { CategoryCard } from './CategoryCard'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export function CarbonBilanContainer() {
  const navigate = useNavigate()

  const data = mockCarbonScoreHistory
  const nextQuizDate = getNextQuizDate(data.userProfile)

  const isAboveAverage = data.currentScore > data.averageScore
  const message = isAboveAverage
    ? 'Votre score est supérieur à la moyenne.'
    : 'Votre score est inférieur à la moyenne.'

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-green-50 to-blue-50">
      {/* Back Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 text-green-700 hover:text-green-800 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>
      </div>

      {/* Logo */}
      <div className="px-4 py-4">
        <img
          src="/logo-vertical.png"
          alt="TerraScore"
          className="w-auto max-w-[200px] mx-auto object-contain"
        />
      </div>

      {/* Score Carbone Title */}
      <div className="px-4 py-1 text-center">
        <h1 className="text-xl font-bold text-gray-900">Score Carbone</h1>
      </div>

      {/* Score Circle */}
      <div className="px-4 py-2">
        <CarbonScoreCircle score={data.currentScore} message={message} />
      </div>

      {/* Categories */}
      <div className="px-4 py-3">
        <div className="space-y-3">
          {data.categories.map((category) => (
            <CategoryCard
              key={category.id}
              name={category.name}
              score={category.score}
              maxScore={category.maxScore}
              percentage={category.percentage}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-8 text-center">
        <p className="text-sm text-gray-700 font-medium">
          Votre prochain Quizz de mise à jour des données sera le {nextQuizDate}.
        </p>
      </div>
    </div>
  )
}
