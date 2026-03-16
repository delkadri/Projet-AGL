import { HeadContent, Outlet, Scripts, createRootRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

import { OpenAPI } from '@/api/client'
import { AuthProvider, useAuth } from '@/auth/AuthContext'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const NO_HEADER_PATHS = ['/login', '/inscription', '/quiz', '/parcours', '/carbon-quiz', '/carbon-quiz-questions'] as const

// Configure the base URL for all generated API clients
const apiPort = process.env?.API_PORT || '8000'

const apiBase =
  typeof window === 'undefined'
    ? `http://localhost:${apiPort}/api`
    : `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`

OpenAPI.BASE = apiBase

const queryClient = new QueryClient()

const PUBLIC_ROUTES = ['/login', '/inscription'] as const

type PublicRoutePath = (typeof PUBLIC_ROUTES)[number]

function isPublicRoute(pathname: string): pathname is PublicRoutePath {
  return PUBLIC_ROUTES.some((p) => pathname === p)
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { isAuthenticated, isAuthLoading } = useAuth()

  const hideHeader = NO_HEADER_PATHS.some((p) => pathname === p)

  if (!isAuthLoading && !isAuthenticated && !isPublicRoute(pathname)) {
    void navigate({ to: '/login', replace: true })
    return null
  }

  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
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
