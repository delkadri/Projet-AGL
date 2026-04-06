import { HeadContent, Outlet, Scripts, createRootRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

import { OpenAPI } from '@/api/client'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const NO_HEADER_PATHS = ['/login', '/inscription', '/carbon-quiz-questions'] as const

// Configure the base URL for all generated API clients
const apiPort = process.env?.API_PORT || '8000'

const apiBase =
  typeof window === 'undefined'
    ? `http://localhost:${apiPort}/api`
    : `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`

OpenAPI.BASE = apiBase

// Ensure the access token is sent on every request (e.g. /auth/me) by resolving it from storage at request time
if (typeof window !== 'undefined') {
  OpenAPI.TOKEN = async () => {
    try {
      const stored = window.localStorage.getItem('auth')
      const parsed = stored ? (JSON.parse(stored) as { accessToken?: string }) : null
      return parsed?.accessToken ?? ''
    } catch {
      return ''
    }
  }
}

const queryClient = new QueryClient()

const PUBLIC_ROUTES = ['/login', '/inscription'] as const

type PublicRoutePath = (typeof PUBLIC_ROUTES)[number]

function isPublicRoute(pathname: string): pathname is PublicRoutePath {
  return PUBLIC_ROUTES.some((p) => pathname === p)
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { isAuthenticated, isAuthLoading, isOnboardingCompleted } = useAuth()

  const hideHeader = NO_HEADER_PATHS.some((p) => pathname === p)
  /** Évite que le `<main>` défile en entier sur la page chat (hauteur verrouillée + scroll interne). */
  const lockMainVerticalScroll = /^\/communautes\/[^/]+$/.test(pathname)

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated && !isPublicRoute(pathname)) {
      void navigate({ to: '/login', replace: true })
    } else if (isAuthenticated && isPublicRoute(pathname)) {
      void navigate({ to: '/', replace: true })
    } else if (isAuthenticated && isOnboardingCompleted && pathname.startsWith('/onboarding')) {
      void navigate({ to: '/', replace: true })
    }
  }, [isAuthLoading, isAuthenticated, isOnboardingCompleted, pathname, navigate])

  if (isAuthLoading) {
    return null
  }

  if (!isAuthenticated && !isPublicRoute(pathname)) return null
  if (isAuthenticated && isPublicRoute(pathname)) return null
  if (isAuthenticated && isOnboardingCompleted && pathname.startsWith('/onboarding')) return null

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      {!hideHeader && <Header />}
      <main
        className={`flex min-h-0 flex-1 flex-col overflow-x-hidden ${lockMainVerticalScroll ? 'overflow-y-hidden' : 'overflow-y-auto'} ${!hideHeader ? 'bg-[#f1f8e9] pt-[calc(5.25rem+env(safe-area-inset-top,0px))]' : ''}`}
      >
        {children}
      </main>
    </div>
  )
}

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard>
          <Outlet />
        </AuthGuard>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function AuthAwareNotFound() {
  const navigate = useNavigate()
  const { isAuthenticated, isAuthLoading } = useAuth()

  useEffect(() => {
    if (isAuthLoading) return

    void navigate({
      to: isAuthenticated ? '/' : '/login',
      replace: true,
    })
  }, [isAuthenticated, isAuthLoading, navigate])

  return null
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: AuthAwareNotFound,
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TerraScore',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
