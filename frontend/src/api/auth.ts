import {
  AuthService,
  OpenAPI,
  type AuthResponseDto,
  type UserProfileResponseDto,
} from '@/api/client'

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

export type CurrentUser = UserProfileResponseDto | null

export async function getCurrentUser(): Promise<CurrentUser> {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem('auth')
    const parsed = stored
      ? (JSON.parse(stored) as { accessToken?: string })
      : null

    if (!parsed?.accessToken) {
      return null
    }

    OpenAPI.TOKEN = parsed.accessToken
    const profile = await AuthService.authControllerGetMe()

    try {
      const current = JSON.parse(stored!) as Record<string, unknown>
      window.localStorage.setItem(
        'auth',
        JSON.stringify({ ...current, user: profile }),
      )
    } catch {
      // ignore storage errors
    }

    return profile
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status
    if (status === 401) {
      try {
        window.localStorage.removeItem('auth')
      } catch {
        // ignore
      }
      OpenAPI.TOKEN = undefined
    }
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

