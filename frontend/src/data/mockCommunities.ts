import type {
  CommunityDto,
  CreateCommunityPayload,
  UserCommunityMembershipDto,
} from '@/types/community'

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
      is_private: false,
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
      is_private: false,
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
      is_private: true,
      created_at: '2025-12-01T00:00:00.000Z',
      updated_at: '2026-04-05T08:00:00.000Z',
    },
  },
]

let additionalMemberships: UserCommunityMembershipDto[] = []

export function getAllMockMemberships(): UserCommunityMembershipDto[] {
  return [...MOCK_USER_COMMUNITIES, ...additionalMemberships]
}

function rebuildByIdMap(): Map<string, CommunityDto> {
  return new Map(
    getAllMockMemberships().map((m) => [m.community.id, m.community]),
  )
}

export function appendMockMembership(m: UserCommunityMembershipDto): void {
  additionalMemberships = [...additionalMemberships, m]
}

export function getMockCommunityById(id: string): CommunityDto | undefined {
  return rebuildByIdMap().get(id)
}

function slugify(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base.length > 0 ? base : 'groupe'
}

const CREATE_LATENCY_MS = 550

/**
 * Simule POST /communities — enrichit le store mock (liste + détail).
 * Le mot de passe ne figure pas dans la réponse (comme une API réelle après hash).
 */
export async function mockCreateCommunity(
  payload: CreateCommunityPayload,
): Promise<UserCommunityMembershipDto> {
  await new Promise((r) => setTimeout(r, CREATE_LATENCY_MS))

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const slug = `${slugify(payload.name)}-${id.slice(0, 8)}`

  const community: CommunityDto = {
    id,
    slug,
    name: payload.name.trim(),
    description: payload.description.trim(),
    member_count: 1,
    is_private: payload.is_private,
    created_at: now,
    updated_at: now,
  }

  const membership: UserCommunityMembershipDto = {
    community,
    role: 'ADMIN',
    joined_at: now,
    has_pending_defi: false,
  }

  appendMockMembership(membership)
  return membership
}
