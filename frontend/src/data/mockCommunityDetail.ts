import type { CommunityDetailDto } from '@/types/community'

const TREE = (rank: number, user_id: string, display_name: string, tree_score: number) => ({
  rank,
  user_id,
  display_name,
  tree_score,
})

/** Détail mock par communauté (GET /communities/:id cible). */
const DETAIL_BY_ID: Record<string, CommunityDetailDto> = {
  '8f3c2a10-4b5d-4e6f-a7b8-9012345678ab': {
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
    active_defi: {
      id: 'defi-lv-2026-w14',
      title: 'SEMAINE ZÉRO GOBELET',
      description: 'Utiliser uniquement une gourde ou une tasse réutilisable au bureau.',
      points: 200,
      iconKey: 'leaf',
      bonus_feuilles: 200,
      ends_at: '2026-04-12T21:59:59.000Z',
      members_completed: 28,
      members_total_for_challenge: 42,
      current_user_completed: false,
      progress_caption: 'Membres ayant relevé le défi dans la communauté',
    },
    win_streak: {
      count: 3,
      status: 'active',
      challenge_ends_at: '2026-04-12T21:59:59.000Z',
      last_full_completion_at: '2026-04-05T18:00:00.000Z',
    },
    tree_ranking: [
      TREE(1, 'u1', 'Camille R.', 1840),
      TREE(2, 'u2', 'Thomas B.', 1620),
      TREE(3, 'u3', 'Sarah M.', 1595),
      TREE(4, 'u-mock', 'Vous', 1420),
      TREE(5, 'u5', 'Lucas P.', 1380),
      TREE(6, 'u6', 'Emma D.', 1205),
    ],
  },
  '2d9e1f33-7c88-4a99-b0cc-112233445566': {
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
    active_defi: {
      id: 'defi-qn-2026-w14',
      title: 'TRI SANS FAUTE',
      description: 'Porter ses déchets recyclables au point d’apport en fin de semaine.',
      points: 120,
      iconKey: 'recycle',
      bonus_feuilles: 120,
      ends_at: '2026-04-08T23:59:59.000Z',
      members_completed: 112,
      members_total_for_challenge: 128,
      current_user_completed: true,
      progress_caption: 'Membres ayant relevé le défi dans la communauté',
    },
    win_streak: {
      count: 2,
      status: 'at_risk',
      challenge_ends_at: '2026-04-08T23:59:59.000Z',
      last_full_completion_at: '2026-03-30T12:00:00.000Z',
    },
    tree_ranking: [
      TREE(1, 'v1', 'Nadia K.', 2100),
      TREE(2, 'v2', 'Hugo L.', 1980),
      TREE(3, 'v3', 'Inès F.', 1920),
      TREE(4, 'v4', 'Karim T.', 1755),
      TREE(5, 'v5', 'Julie C.', 1680),
    ],
  },
  'aa11bb22-cc33-dd44-ee55-ff6677889900': {
    community: {
      id: 'aa11bb22-cc33-dd44-ee55-ff6677889900',
      slug: 'cyclo-club',
      name: 'Cyclo club TerraScore',
      description: 'Challenges kilomètres à vélo et covoiturage doux.',
      member_count: 67,
      created_at: '2025-12-01T00:00:00.000Z',
      updated_at: '2026-04-05T08:00:00.000Z',
    },
    active_defi: {
      id: 'defi-cc-demo-streak',
      title: '2 TRAJETS À VÉLO',
      description: 'Remplacer au moins deux déplacements courts par le vélo cette semaine.',
      points: 180,
      iconKey: 'bike',
      bonus_feuilles: 180,
      ends_at: '2026-04-13T20:00:00.000Z',
      members_completed: 4,
      members_total_for_challenge: 5,
      current_user_completed: false,
      progress_caption: 'Participants inscrits au défi cette semaine',
    },
    win_streak: {
      count: 0,
      status: 'broken',
      challenge_ends_at: '2026-04-13T20:00:00.000Z',
      last_full_completion_at: null,
    },
    tree_ranking: [
      TREE(1, 'c1', 'Alex V.', 2450),
      TREE(2, 'c2', 'Morgan T.', 2320),
      TREE(3, 'c3', 'Rafa G.', 2180),
      TREE(4, 'c4', 'Léa S.', 2050),
      TREE(5, 'c5', 'Chris N.', 1890),
    ],
  },
}

export function getMockCommunityDetail(communityId: string): CommunityDetailDto | undefined {
  return DETAIL_BY_ID[communityId]
}
