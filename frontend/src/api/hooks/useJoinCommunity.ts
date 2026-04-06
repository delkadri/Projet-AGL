import { useMutation, useQueryClient } from '@tanstack/react-query'

import { COMMUNITY_SEARCH_QUERY_KEY_PREFIX } from '@/api/hooks/useCommunitySearch'
import { USER_COMMUNITIES_QUERY_KEY } from '@/api/hooks/useUserCommunities'
import {
  getMockDirectoryEntry,
  mockInviteCodeMatches,
} from '@/data/mockCommunityDirectory'
import { pushMockCommunityJoin } from '@/data/mockCommunitySession'
import type { UserCommunityMembershipDto } from '@/types/community'

const MOCK_JOIN_MS = 520

export const JOIN_ERROR_INVALID_CODE = 'JOIN_INVALID_INVITE_CODE'
export const JOIN_ERROR_NOT_FOUND = 'JOIN_COMMUNITY_NOT_FOUND'

function membershipFromDirectoryEntry(
  entry: NonNullable<ReturnType<typeof getMockDirectoryEntry>>,
): UserCommunityMembershipDto {
  const { visibility: _v, ...community } = entry
  return {
    role: 'MEMBER',
    joined_at: new Date().toISOString(),
    has_pending_defi: false,
    community,
  }
}

/**
 * Simule POST /communities/:id/join (body { invite_code? } si privée).
 */
export function useJoinCommunity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      communityId,
      inviteCode,
    }: {
      communityId: string
      inviteCode?: string
    }) => {
      await new Promise((r) => setTimeout(r, MOCK_JOIN_MS))
      const entry = getMockDirectoryEntry(communityId)
      if (!entry) {
        throw new Error(JOIN_ERROR_NOT_FOUND)
      }
      if (entry.visibility === 'private' && !mockInviteCodeMatches(communityId, inviteCode)) {
        throw new Error(JOIN_ERROR_INVALID_CODE)
      }
      const membership = membershipFromDirectoryEntry(entry)
      pushMockCommunityJoin(membership)
      return membership
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_COMMUNITIES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: COMMUNITY_SEARCH_QUERY_KEY_PREFIX })
    },
  })
}
