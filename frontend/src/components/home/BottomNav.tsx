import { Link, useRouterState } from '@tanstack/react-router'
import { FileText, PlusCircle, Leaf, BarChart3, Users } from 'lucide-react'

import { Menubar, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'

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
    <div className="fixed bottom-0 left-0 right-0 z-40" role="navigation">
      <Menubar>
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = label === 'Accueil' && pathname === '/'

          return (
            <MenubarMenu key={label}>
              <MenubarTrigger data-active={isActive}>
                <Link to={to} className="flex flex-col items-center gap-0.5">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
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
