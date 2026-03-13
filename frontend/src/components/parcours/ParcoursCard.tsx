import type { Parcours } from '@/types/parcours'

interface ParcoursCardProps {
  parcours: Parcours
  onSelect: (parcoursId: string) => void
  isSelected: boolean
}

export const ParcoursCard = ({ parcours, onSelect, isSelected }: ParcoursCardProps) => {
  const defisText = parcours.frequency?.defis || '0 défi'
  const quizzText = parcours.frequency?.quizz || '0 quizz'

  const getBackgroundColor = (id: string) => {
    switch (id) {
      case 'parcours-1':
        return 'bg-[#AFD29C]'
      case 'parcours-2':
        return 'bg-[#5D963E]'
      case 'parcours-3':
        return 'bg-[#559B63]'
      default:
        return 'bg-white'
    }
  }

  const getImageBackgroundColor = (id: string) => {
    switch (id) {
      case 'parcours-1':
        return 'bg-[#AFD29C]'
      case 'parcours-2':
        return 'bg-[#5D963E]'
      case 'parcours-3':
        return 'bg-[#559B63]'
      default:
        return 'bg-gray-100'
    }
  }

  return (
    <div
      onClick={() => onSelect(parcours.id)}
      className={`flex border-2 rounded-lg overflow-hidden ${getBackgroundColor(parcours.id)} shadow-lg hover:shadow-xl transition-all cursor-pointer ${
        isSelected
          ? 'border-emerald-500 bg-opacity-75 shadow-dark-900 shadow-xl'
          : 'border-gray-200'
      }`}
    >
      {/* Left image column */}
      <div className={`w-1/4 ${getImageBackgroundColor(parcours.id)} flex items-center justify-center px-2`}>
        <img
          src={parcours.imageUrl ?? '/placeholder.png'}
          alt={parcours.name}
          className="object-contain w-full max-h-20 rounded-lg shadow-lg"
        />
      </div>

      {/* Right content column */}
      <div className="flex-1 p-2 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h2 className="text-lg font-bold text-[#1E1E1E]">
            {parcours.name}
          </h2>

          {/* Pills row */}
          <div className="flex gap-1 mt-0">
            <span className="px-1 py-0.5 bg-[#322F35] rounded-sm text-[9px] text-white">
              {defisText}
            </span>
            <span className="px-1 py-0.5 bg-[#322F35] rounded-sm text-[9px] text-white">
              {quizzText}
            </span>
          </div>

          {/* Summary/description */}
          <p className="text-xs text-[#1E1E1E] mt-0.5">
            {parcours.summary ?? parcours.description}
          </p>
        </div>

        {/* placeholder for spacing; no button anymore */}
        <div className="mt-1" />
      </div>
    </div>
  )
}