import type { CommunityDto, UserCommunityMembershipDto } from '@/types/community'

/** Données fictives : forme attendue d’une réponse GET /users/me/communities (exemple). */
export const MOCK_USER_COMMUNITIES: UserCommunityMembershipDto[] = [
  {
    role: 'ADMIN',
    joined_at: '2025-11-02T14:30:00.000Z',
    has_pending_defi: true,
    community: {
      id: '8f3c2a10-4b5d-4e6f-a7b8-9012345678ab',
      slug: 'les-verts',
      name: 'Les Verts',
      description:
        'Équipe entreprise : défis hebdo et partage de bons gestes au bureau et à la maison.',
      member_count: 42,
      created_at: '2025-09-01T08:00:00.000Z',
      updated_at: '2026-04-01T10:00:00.000Z',
    },
  },
  {
    role: 'MEMBER',
    joined_at: '2026-01-15T09:00:00.000Z',
    has_pending_defi: false,
    community: {
      id: '2d9e1f33-7c88-4a99-b0cc-112233445566',
      slug: 'quartier-nord',
      name: 'Quartier Nord — zéro déchet',
      description:
        'Groupe de voisin·e·s pour compost, consigne et ateliers réparation.',
      member_count: 128,
      created_at: '2025-06-20T12:00:00.000Z',
      updated_at: '2026-03-28T16:20:00.000Z',
    },
  },
  {
    role: 'MEMBER',
    joined_at: '2026-03-01T18:45:00.000Z',
    has_pending_defi: false,
    community: {
      id: 'aa11bb22-cc33-dd44-ee55-ff6677889900',
      slug: 'cyclo-club',
      name: 'Cyclo club TerraScore',
      description: 'Challenges kilomètres à vélo et covoiturage doux.',
      member_count: 67,
      created_at: '2025-12-01T00:00:00.000Z',
      updated_at: '2026-04-05T08:00:00.000Z',
    },
  },
]

const byId = new Map<string, CommunityDto>(
  MOCK_USER_COMMUNITIES.map((m) => [m.community.id, m.community]),
)

export function getMockCommunityById(id: string): CommunityDto | undefined {
  return byId.get(id)
}
