import { Link, useRouterState } from '@tanstack/react-router'
import { FileText, PlusCircle, Leaf, BarChart3, Users } from 'lucide-react'

import { useUserCommunities } from '@/api/hooks/useUserCommunities'
import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'

const navItems = [
  { to: '/actualites' as const, label: 'Actualités', icon: FileText },
  { to: '/donnees' as const, label: 'Données', icon: PlusCircle },
  { to: '/' as const, label: 'Accueil', icon: Leaf },
  { to: '/objectifs' as const, label: 'Objectifs', icon: BarChart3 },
  { to: '/communautes' as const, label: 'Groupes', icon: Users },
]

export default function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { data: memberships } = useUserCommunities()
  const communautesDefiBadgeCount =
    memberships?.filter((m) => m.has_pending_defi).length ?? 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40" role="navigation">
      <Menubar>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            label === 'Accueil'
              ? pathname === '/'
              : label === 'Groupes'
                ? pathname === '/communautes' || pathname.startsWith('/communautes/')
                : pathname === to

          const showCommunautesDefiBadge =
            label === 'Groupes' && communautesDefiBadgeCount > 0

          return (
            <MenubarMenu key={label}>
              <MenubarTrigger data-active={isActive}>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-white" />
                )}
                <Link
                  to={to}
                  className="flex flex-col items-center gap-0.5"
                  aria-label={
                    showCommunautesDefiBadge
                      ? `Groupes, ${communautesDefiBadgeCount} groupe${communautesDefiBadgeCount > 1 ? 's' : ''} avec un défi à faire`
                      : undefined
                  }
                >
                  <span className="relative inline-flex shrink-0">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {showCommunautesDefiBadge && (
                      <span className="absolute -right-2 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white shadow-sm">
                        {communautesDefiBadgeCount > 9 ? '9+' : communautesDefiBadgeCount}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          )
        })}
      </Menubar>
    </div>
  )
}
