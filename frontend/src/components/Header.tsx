import { Link } from '@tanstack/react-router'
import { User } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'

export default function Header() {
  const { user } = useAuth()

  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName ? String(user.firstName) : ''} ${user.lastName ? String(user.lastName) : ''}`.trim()
      : user?.email?.split('@')[0] ?? 'Utilisateur'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#e8f5e9] px-3 pt-2 pb-0 mb-0">
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
            <p className="text-sm font-medium text-black">{displayName}</p>
            <p className="text-xs text-black">
              Niveau {user?.niveau ?? 1} · {user?.parcours?.name ?? 'Éco-explorateur'}
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
