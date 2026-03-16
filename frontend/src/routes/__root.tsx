import { HeadContent, Outlet, Scripts, createRootRoute, useRouterState } from '@tanstack/react-router'

import Header from '../components/Header'

import appCss from '../styles.css?url'

const NO_HEADER_PATHS = ['/login', '/inscription', '/quiz', '/parcours'] as const

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const hideHeader = NO_HEADER_PATHS.some((p) => pathname === p)

  return (
    <>
      {!hideHeader && <Header />}
      <Outlet />
    </>
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
