import type { UserCommunityMembershipDto } from '@/types/community'

/**
 * Adhésions ajoutées en session (mock POST /communities/:id/join) pour que
 * « Mes communautés » reflète les joins jusqu’au rafraîchissement complet.
 */
const sessionJoined: UserCommunityMembershipDto[] = []

export function pushMockCommunityJoin(membership: UserCommunityMembershipDto) {
  if (sessionJoined.some((m) => m.community.id === membership.community.id)) return
  sessionJoined.push(membership)
}

export function getSessionJoinedMemberships(): readonly UserCommunityMembershipDto[] {
  return sessionJoined
}
