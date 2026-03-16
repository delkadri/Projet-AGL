import { Link } from '@tanstack/react-router'
import { Leaf, User } from 'lucide-react'

// TODO: Remplacer par les données utilisateur de l'API quand disponible
const MOCK_USER = {
  name: 'John Doe',
  level: 3,
  badge: 'Éco-explorateur',
} as const

export default function Header() {
  return (
    <header className="w-full bg-[#e8f5e9] px-4 py-3">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex flex-col">
          <span className="flex items-baseline font-bold text-[#1b5e20]">
            Terr
            <span className="relative">
              a
              <Leaf
                className="absolute -right-1.5 -top-2.5 h-3.5 w-3.5 text-[#2e7d32]"
                aria-hidden
              />
            </span>
            Score
          </span>
          <span className="text-xs text-gray-500">
            Mesurez. Réduisez. Respirez.
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-black">{MOCK_USER.name}</p>
            <p className="text-xs text-black">
              Niveau {MOCK_USER.level} · {MOCK_USER.badge}
            </p>
          </div>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1b5e20] text-white"
            aria-hidden
          >
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="mt-3 h-px bg-gray-200" role="separator" />
    </header>
  )
}
