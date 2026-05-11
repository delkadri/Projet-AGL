import type { UserProfileResponseDto } from '@/api/client'

export function displayNameFromUser(user: UserProfileResponseDto | null | undefined): string {
  if (!user?.email) return 'Moi'
  const local = user.email.split('@')[0]?.trim()
  return local && local.length > 0 ? local : 'Moi'
}
