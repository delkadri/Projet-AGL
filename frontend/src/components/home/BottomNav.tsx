import { Link, useRouterState } from '@tanstack/react-router'
import {
  FileText,
  PlusCircle,
  Leaf,
  BarChart3,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// TODO: Créer les routes /actualites, /donnees, /objectifs, /communautes quand les pages seront prêtes
const navItems = [
  { to: '/' as const, label: 'Actualités', icon: FileText }, // placeholder
  { to: '/' as const, label: 'Données', icon: PlusCircle }, // placeholder
  { to: '/' as const, label: 'Accueil', icon: Leaf },
  { to: '/' as const, label: 'Objectifs', icon: BarChart3 }, // placeholder
  { to: '/' as const, label: 'Communautés', icon: Users }, // placeholder
] as const

export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around bg-[#1b5e20] text-white"
      role="navigation"
    >
      {navItems.map(({ to, label, icon: Icon }) => {
        const isActive = label === 'Accueil' && pathname === '/'
        return (
          <Link
            key={label}
            to={to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
              isActive ? 'bg-[#2e7d32]' : 'hover:bg-[#2e7d32]/70'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
