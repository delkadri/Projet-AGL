import type { CommunityDirectoryEntryDto } from '@/types/community'

/**
 * Annuaire fictif (cible GET /communities?q=…).
 * Cohérent avec CommunityDto + champ visibility (future colonne communities.visibility).
 */
export const MOCK_COMMUNITY_DIRECTORY: CommunityDirectoryEntryDto[] = [
  {
    id: '8f3c2a10-4b5d-4e6f-a7b8-9012345678ab',
    slug: 'les-verts',
    name: 'Les Verts',
    description:
      'Équipe entreprise : défis hebdo et partage de bons gestes au bureau et à la maison.',
    member_count: 42,
    created_at: '2025-09-01T08:00:00.000Z',
    updated_at: '2026-04-01T10:00:00.000Z',
    visibility: 'public',
  },
  {
    id: '2d9e1f33-7c88-4a99-b0cc-112233445566',
    slug: 'quartier-nord',
    name: 'Quartier Nord — zéro déchet',
    description:
      'Groupe de voisin·e·s pour compost, consigne et ateliers réparation.',
    member_count: 128,
    created_at: '2025-06-20T12:00:00.000Z',
    updated_at: '2026-03-28T16:20:00.000Z',
    visibility: 'public',
  },
  {
    id: 'aa11bb22-cc33-dd44-ee55-ff6677889900',
    slug: 'cyclo-club',
    name: 'Cyclo club TerraScore',
    description: 'Challenges kilomètres à vélo et covoiturage doux.',
    member_count: 67,
    created_at: '2025-12-01T00:00:00.000Z',
    updated_at: '2026-04-05T08:00:00.000Z',
    visibility: 'public',
  },
  {
    id: 'b101c202-d303-e404-f505-060708090a0b',
    slug: 'eco-innov',
    name: 'Éco-innov Bâtiment A',
    description:
      'Communauté restreinte : équipe R&D et partenaires du bâtiment A (code fourni par l’admin).',
    member_count: 24,
    created_at: '2025-10-10T09:00:00.000Z',
    updated_at: '2026-03-15T11:00:00.000Z',
    visibility: 'private',
  },
  {
    id: 'c202d303-e404-f505-0607-08090a0b0c0d',
    slug: 'campus-sud',
    name: 'Campus Sud — mobilité',
    description: 'Étudiant·e·s et personnel : défis mobilité douce et repas de quartier.',
    member_count: 201,
    created_at: '2025-04-01T00:00:00.000Z',
    updated_at: '2026-04-02T14:30:00.000Z',
    visibility: 'public',
  },
  {
    id: 'd303e404-f505-0607-0809-0a0b0c0d0e0f',
    slug: 'voisins-bio',
    name: 'Voisins & bio local',
    description: 'Panier groupé, AMAP et ateliers cuisine anti-gaspi.',
    member_count: 55,
    created_at: '2025-08-12T16:00:00.000Z',
    updated_at: '2026-03-20T10:00:00.000Z',
    visibility: 'public',
  },
  {
    id: 'f404f505-0607-0809-0a0b-0c0d0e0f1011',
    slug: 'terrascore-alumni',
    name: 'TerraScore Alumni',
    description: 'Espace privé pour ancien·ne·s parcours : défis avancés et mentorat.',
    member_count: 18,
    created_at: '2025-11-01T12:00:00.000Z',
    updated_at: '2026-04-06T09:00:00.000Z',
    visibility: 'private',
  },
]

/** Codes d’invitation fictifs (côté serveur en prod ; ici uniquement pour le mock). */
const MOCK_INVITE_CODES: Record<string, string> = {
  'b101c202-d303-e404-f505-060708090a0b': 'ECOBAT24',
  'f404f505-0607-0809-0a0b-0c0d0e0f1011': 'ALUMNI26',
}

export function mockInviteCodeMatches(communityId: string, code: string | undefined): boolean {
  const expected = MOCK_INVITE_CODES[communityId]
  if (!expected || code === undefined) return false
  return expected.toLowerCase() === code.trim().toLowerCase()
}

export type CommunitySearchHitDto = CommunityDirectoryEntryDto & { already_member: boolean }

export function searchMockCommunities(
  query: string,
  memberIds: ReadonlySet<string>,
): CommunitySearchHitDto[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  return MOCK_COMMUNITY_DIRECTORY.filter((c) => {
    const hay = `${c.name} ${c.description} ${c.slug}`.toLowerCase()
    return hay.includes(q)
  }).map((c) => ({
    ...c,
    already_member: memberIds.has(c.id),
  }))
}

export function getMockDirectoryEntry(
  communityId: string,
): CommunityDirectoryEntryDto | undefined {
  return MOCK_COMMUNITY_DIRECTORY.find((c) => c.id === communityId)
}

/** Suggestions lorsque la recherche est vide : communautés publiques non rejointes. */
export function getMockFeaturedCommunities(
  memberIds: ReadonlySet<string>,
  limit = 3,
): CommunitySearchHitDto[] {
  return MOCK_COMMUNITY_DIRECTORY.filter((c) => c.visibility === 'public' && !memberIds.has(c.id))
    .slice(0, limit)
    .map((c) => ({ ...c, already_member: false }))
}
