import { Link } from '@tanstack/react-router'
import { User } from 'lucide-react'

// TODO: Remplacer par les données utilisateur de l'API quand disponible
const MOCK_USER = {
  name: 'John Doe',
  level: 3,
  badge: 'Éco-explorateur',
} as const

export default function Header() {
  return (
    <header className="w-full bg-[#e8f5e9] px-3 pt-2 pb-0">
      <div className="flex items-center justify-between gap-0 p-0.5">
        <Link to="/" className="flex items-center">
          <img
            src="/logo-vertical.png"
            alt="TerraScore - Mesurez. Réduisez. Respirez."
            className="h-10 w-auto overflow-visible pl-1 pr-1"
          />
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
