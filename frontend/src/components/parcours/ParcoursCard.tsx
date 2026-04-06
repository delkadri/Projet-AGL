import { Check } from 'lucide-react'
import type { Parcours } from '@/types/parcours'

interface ParcoursCardProps {
  parcours: Parcours
  onSelect: (parcoursId: string) => void
  isSelected: boolean
}

type SlugTheme = {
  gradient: string
  ring: string
  checkBg: string
}

function getSlugTheme(slug: string): SlugTheme {
  switch (slug) {
    case 'decouverte':
      return {
        gradient: 'from-[#d4edbc] to-[#8fc96b]',
        ring: 'ring-[#5d8c3e]',
        checkBg: 'bg-[#5d8c3e]',
      }
    case 'progression':
      return {
        gradient: 'from-[#7bb85a] to-[#3d6228]',
        ring: 'ring-[#3d6228]',
        checkBg: 'bg-[#3d6228]',
      }
    case 'challenge':
      return {
        gradient: 'from-[#74ba82] to-[#2f6b3f]',
        ring: 'ring-[#2f6b3f]',
        checkBg: 'bg-[#2f6b3f]',
      }
    default:
      return {
        gradient: 'from-slate-200 to-slate-300',
        ring: 'ring-slate-500',
        checkBg: 'bg-slate-600',
      }
  }
}

export function ParcoursCard({ parcours, onSelect, isSelected }: ParcoursCardProps) {
  const theme = getSlugTheme(parcours.slug)

  return (
    <button
      type="button"
      onClick={() => onSelect(parcours.id)}
      aria-pressed={isSelected}
      className="flex flex-col items-center gap-2.5 focus-visible:outline-none"
    >
      <div
        className={`relative flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-linear-to-b p-3 shadow-md transition-all duration-200 ${theme.gradient} ${
          isSelected
            ? `ring-[3px] ${theme.ring} scale-110 shadow-lg`
            : 'ring-2 ring-transparent opacity-70 hover:opacity-100 hover:scale-105'
        }`}
      >
        <img
          src={parcours.imageUrl ?? '/placeholder.png'}
          alt={parcours.name}
          className="h-13 w-13 object-contain drop-shadow"
        />
        {isSelected && (
          <span
            className={`absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full shadow ${theme.checkBg}`}
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </span>
        )}
      </div>
      <span
        className={`max-w-[88px] text-center text-[11px] font-semibold leading-tight transition-colors duration-200 ${
          isSelected ? 'text-[#1A4D3E]' : 'text-slate-400'
        }`}
      >
        {parcours.name}
      </span>
    </button>
  )
}
