import { useMutation, useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/api/client'
import { getCurrentUser, login, logout, register, type CurrentUser } from '@/api/auth'

const AUTH_ME_QUERY_KEY = ['auth', 'me'] as const

export function useCurrentUserQuery() {
  return useQuery<CurrentUser>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLoginMutation() {
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: login,
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: register,
  })
}

export function getAuthErrorMessage(error: unknown): string {
  const err = error as ApiError | undefined

  if (!err) {
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  if (err.status === 401) {
    return 'Email ou mot de passe incorrect.'
  }

  if (err.status === 400) {
    return "Les informations fournies ne sont pas valides. Veuillez vérifier les champs saisis."
  }

  return 'Une erreur est survenue. Veuillez réessayer.'
}

export { logout, AUTH_ME_QUERY_KEY }

