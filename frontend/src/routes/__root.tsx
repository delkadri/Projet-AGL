import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { OpenAPI } from '@/api/client'
import Header from '../components/Header'

import appCss from '../styles.css?url'

const NO_HEADER_PATHS = ['/login', '/inscription', '/quiz', '/parcours', '/carbon-quiz', '/carbon-quiz-questions', '/carbon-quiz-results'] as const

// Configure the base URL for all generated API clients
const apiPort = process.env?.API_PORT || '8000'

const apiBase =
  typeof window === 'undefined'
    ? `http://localhost:${apiPort}/api`
    : `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`

OpenAPI.BASE = apiBase

const queryClient = new QueryClient()

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hideHeader = NO_HEADER_PATHS.some((p) => pathname === p)

  return (
    <QueryClientProvider client={queryClient}>
      <>
        {!hideHeader && <Header />}
        <Outlet />
      </>
    </QueryClientProvider>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
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
