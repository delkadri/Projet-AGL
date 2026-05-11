/** Champs du profil utiles avant le premier `GET /auth/me` ou entre deux navigations. */
export type StoredAuthUser = {
  onboardingCompleted?: boolean
  hasOnboardingBilan?: boolean
}

export function readStoredAuthUser(): StoredAuthUser | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem('auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as {
      user?: StoredAuthUser
      accessToken?: string
    }
    if (!parsed.user || !parsed.accessToken) return null
    return parsed.user
  } catch {
    return null
  }
}
