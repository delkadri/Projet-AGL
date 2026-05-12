import { OpenAPI } from '@/api/client'
import { request as __request } from '@/api/client/core/request'
import type { Challenge, ChallengeListResponse } from '@/types/challenge'

export type CompleteChallengeResponse = {
  challenge: Challenge
  feuilles?: number
  niveau?: number
}

const USER_CHALLENGES_PATH = '/challenges/me'
const COMPLETE_USER_CHALLENGE_PATH = '/challenges/me/{challengeId}/complete'

function normalizeChallengeListResponse(
  response: Challenge[] | ChallengeListResponse,
): ChallengeListResponse {
  if (Array.isArray(response)) {
    return {
      challenges: response,
      total: response.length,
    }
  }

  return {
    challenges: response.challenges,
    total: response.total ?? response.challenges.length,
  }
}

export async function getUserChallenges(): Promise<ChallengeListResponse> {
  const response = await __request<Challenge[] | ChallengeListResponse>(OpenAPI, {
    method: 'GET',
    url: USER_CHALLENGES_PATH,
  })

  return normalizeChallengeListResponse(response)
}

export function completeUserChallenge(challengeId: string) {
  return __request<CompleteChallengeResponse>(OpenAPI, {
    method: 'PATCH',
    url: COMPLETE_USER_CHALLENGE_PATH,
    path: {
      challengeId,
    },
  })
}
