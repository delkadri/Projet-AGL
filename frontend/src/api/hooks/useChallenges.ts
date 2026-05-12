import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  completeUserChallenge,
  getUserChallenges,
  type CompleteChallengeResponse,
} from '@/api/challenges'
import type { CurrentUser } from '@/api/auth'
import { AUTH_ME_QUERY_KEY } from '@/api/hooks/useAuth'
import type { Challenge, ChallengeListResponse } from '@/types/challenge'

export const USER_CHALLENGES_QUERY_KEY = ['challenges', 'me'] as const

function markChallengeCompleted(challenge: Challenge): Challenge {
  if (challenge.completed) return challenge

  return {
    ...challenge,
    completed: true,
    completedAt: new Date().toISOString(),
  }
}

function applyCompletedChallenge(
  current: ChallengeListResponse | undefined,
  challengeId: string,
  completedChallenge?: Challenge,
): ChallengeListResponse | undefined {
  if (!current) return current

  return {
    ...current,
    challenges: current.challenges.map((challenge) => {
      if (challenge.id !== challengeId) return challenge
      return completedChallenge ?? markChallengeCompleted(challenge)
    }),
  }
}

export function useUserChallengesQuery() {
  return useQuery<ChallengeListResponse>({
    queryKey: USER_CHALLENGES_QUERY_KEY,
    queryFn: getUserChallenges,
    staleTime: 60 * 1000,
  })
}

export function useCompleteChallengeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ['challenges', 'complete'],
    mutationFn: completeUserChallenge,
    onMutate: async (challengeId) => {
      await queryClient.cancelQueries({ queryKey: USER_CHALLENGES_QUERY_KEY })

      const previousChallenges = queryClient.getQueryData<ChallengeListResponse>(
        USER_CHALLENGES_QUERY_KEY,
      )
      const previousUser = queryClient.getQueryData<CurrentUser>(AUTH_ME_QUERY_KEY)
      const challengeToComplete = previousChallenges?.challenges.find(
        (challenge) => challenge.id === challengeId,
      )

      queryClient.setQueryData<ChallengeListResponse>(
        USER_CHALLENGES_QUERY_KEY,
        (current) => applyCompletedChallenge(current, challengeId),
      )

      if (previousUser && challengeToComplete && !challengeToComplete.completed) {
        queryClient.setQueryData<CurrentUser>(AUTH_ME_QUERY_KEY, {
          ...previousUser,
          feuilles: previousUser.feuilles + challengeToComplete.leafReward,
        })
      }

      return { previousChallenges, previousUser }
    },
    onError: (_error, _challengeId, context) => {
      queryClient.setQueryData(USER_CHALLENGES_QUERY_KEY, context?.previousChallenges)
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, context?.previousUser)
    },
    onSuccess: (response: CompleteChallengeResponse, challengeId) => {
      queryClient.setQueryData<ChallengeListResponse>(
        USER_CHALLENGES_QUERY_KEY,
        (current) => applyCompletedChallenge(current, challengeId, response.challenge),
      )

      if (response.feuilles !== undefined || response.niveau !== undefined) {
        queryClient.setQueryData<CurrentUser>(AUTH_ME_QUERY_KEY, (current) => {
          if (!current) return current

          return {
            ...current,
            feuilles: response.feuilles ?? current.feuilles,
            niveau: response.niveau ?? current.niveau,
          }
        })
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: USER_CHALLENGES_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY })
    },
  })
}
