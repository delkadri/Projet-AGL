/**
 * Types cibles pour une future API / schéma Prisma cohérent avec le reste du projet
 * (même esprit que `parcours` : id uuid, slug unique, name, description, timestamps).
 *
 * Modèles envisageables :
 * - communities: id, slug, name, description, created_at, updated_at
 * - community_members: id, user_id, community_id, role, joined_at
 * - community_challenges: id, community_id, title, bonus_feuilles, ends_at, …
 * - community_challenge_progress: user_id, challenge_id, completed_at
 */
export type CommunityMemberRole = "ADMIN" | "MEMBER";

export type ChallengeIconKey = "beef" | "bike" | "recycle" | "leaf";

/** Présentation UI d’un défi (accueil ou communauté). */
export interface ChallengePresentationDto {
    /** Ex. « 1/3 défis cette semaine » — optionnel (carte accueil). */
    weekProgressLabel?: string;
    title: string;
    description: string;
    points: number;
    iconKey: ChallengeIconKey;
}

export interface CommunityDto {
    id: string;
    slug: string;
    name: string;
    description: string;
    member_count: number;
    created_at: string;
    updated_at: string;
}

/** Visibilité (future API / colonne `communities.visibility`). */
export type CommunityVisibility = "public" | "private";

/** Entrée d’annuaire ou de recherche (GET /communities). */
export interface CommunityDirectoryEntryDto extends CommunityDto {
    visibility: CommunityVisibility;
}

export interface UserCommunityMembershipDto {
    community: CommunityDto;
    /** Rôle côté API (non affiché sur la liste). */
    role: CommunityMemberRole;
    joined_at: string;
    /** Au plus un défi actif par communauté ; true = défi à faire pour l’utilisateur. */
    has_pending_defi: boolean;
}

export type CommunityWinStreakStatus = "active" | "at_risk" | "broken";

/** Aligné sur une future règle métier : +1 si tous les participants ont validé avant ends_at. */
export interface CommunityWinStreakDto {
    count: number;
    status: CommunityWinStreakStatus;
    /** Fin du défi en cours (fenêtre max 7 jours côté produit). */
    challenge_ends_at: string;
    /** Dernière fois où la communauté a complété à 100 % (ISO), si applicable. */
    last_full_completion_at: string | null;
}

export interface CommunityActiveDefiDto extends ChallengePresentationDto {
    id: string;
    ends_at: string;
    /** Feuilles bonus si la communauté valide le défi à 100 % avant la date limite. */
    bonus_feuilles: number;
    /** Membres ayant coché le défi dans la fenêtre courante. */
    members_completed: number;
    /**
     * Effectif pris en compte pour la barre (souvent = taille communauté ;
     * peut être un sous-ensemble « inscrits au défi »).
     */
    members_total_for_challenge: number;
    current_user_completed: boolean;
    /** Libellé court pour la jauge (ex. participants cette semaine). */
    progress_caption?: string;
}

/** Classement type « arbres » : score dérivé des feuilles utilisateur (esprit colonne users.feuilles). */
export interface CommunityTreeRankingEntryDto {
    rank: number;
    user_id: string;
    display_name: string;
    tree_score: number;
}

export interface CommunityDetailDto {
    community: CommunityDto;
    active_defi: CommunityActiveDefiDto;
    win_streak: CommunityWinStreakDto;
    tree_ranking: CommunityTreeRankingEntryDto[];
}

/** Message chat temps réel (Socket.IO mock ou futur backend). */
export interface CommunityChatMessageDto {
    id: string;
    community_id: string;
    user_id: string;
    display_name: string;
    text: string;
    created_at: string;
}

/**
 * Classement global (futur GET /communities/leaderboard).
 * `average_carbon_tco2e_per_year` : même logique qu’une agrégation sur `score_history.score`
 * (empreinte moyenne des membres, exprimée en t CO2e/an côté produit).
 */
export interface InterCommunityLeaderboardEntryDto {
    rank: number;
    community: Pick<CommunityDto, 'id' | 'slug' | 'name' | 'member_count'>;
    average_carbon_tco2e_per_year: number;
    win_streak: Pick<CommunityWinStreakDto, 'count' | 'status'>;
}
