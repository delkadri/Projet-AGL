import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { AUTH_ME_QUERY_KEY, logout, useCurrentUserQuery } from '@/api/hooks/useAuth'
import type { CurrentUser } from '@/api/auth'

type AuthContextValue = {
  user: CurrentUser
  isAuthenticated: boolean
  isOnboardingCompleted: boolean
  isAuthLoading: boolean
  refreshAuth: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useCurrentUserQuery()

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isOnboardingCompleted: user?.onboardingCompleted ?? false,
      isAuthLoading: isLoading,
      refreshAuth: async () => {
        await queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
        await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY })
      },
      logout: () => {
        logout()
        queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
      },
    }),
    [queryClient, isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

