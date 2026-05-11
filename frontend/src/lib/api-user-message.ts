import { ApiError } from '@/api/client'

function nestMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const raw = (body as { message?: unknown }).message
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  if (Array.isArray(raw) && raw.length > 0 && raw.every((m) => typeof m === 'string')) {
    return raw.join(' ')
  }
  return undefined
}

/**
 * Message affichable pour une erreur API (Nest envoie souvent `{ message }` dans le corps).
 */
export function getUserFacingApiMessage(err: unknown): string | undefined {
  if (!(err instanceof ApiError)) return undefined
  const fromBody = nestMessageFromBody(err.body)
  if (fromBody) return fromBody
  const m = err.message?.trim()
  if (m && !m.startsWith('Generic Error:')) return m
  return undefined
}
