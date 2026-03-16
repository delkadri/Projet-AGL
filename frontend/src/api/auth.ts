import { AuthService, OpenAPI, type AuthResponseDto, type UserDto } from '@/api/client'

function applyAuthSession(response: AuthResponseDto) {
  if (!response.session?.access_token) return

  OpenAPI.TOKEN = response.session.access_token

  try {
    window.localStorage.setItem(
      'auth',
      JSON.stringify({
        accessToken: response.session.access_token,
        user: response.user,
        expiresAt: response.session.expires_at,
      }),
    )
  } catch {
    // ignore storage errors
  }
}

export async function login(input: { email: string; password: string }) {
  const res = await AuthService.authControllerLogin({ requestBody: input })
  applyAuthSession(res)
  return res
}

export async function register(input: { email: string; password: string }) {
  const res = await AuthService.authControllerRegister({ requestBody: input })
  applyAuthSession(res)
  return res
}

export type CurrentUser = (UserDto & { onboardingCompleted?: boolean }) | null

export async function getCurrentUser(): Promise<CurrentUser> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem('auth')
    if (!stored) return null

    const parsed = JSON.parse(stored) as {
      user?: UserDto & { onboardingCompleted?: boolean }
      accessToken?: string
      expiresAt?: number
    }

    if (!parsed.user || !parsed.accessToken) {
      return null
    }

    // Réinjecter le token dans OpenAPI si besoin
    OpenAPI.TOKEN = parsed.accessToken

    return parsed.user
  } catch {
    return null
  }
}

export function logout() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem('auth')
  } catch {
    // ignore storage errors
  }

  OpenAPI.TOKEN = undefined
}

