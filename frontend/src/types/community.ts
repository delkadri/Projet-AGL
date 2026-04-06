/**
 * Types cibles pour une future API / schéma Prisma cohérent avec le reste du projet
 * (même esprit que `parcours` : id uuid, slug unique, name, description, timestamps).
 *
 * Modèles envisageables :
 * - communities: id, slug, name, description, created_at, updated_at
 * - community_members: id, user_id, community_id, role, joined_at
 */
export type CommunityMemberRole = 'ADMIN' | 'MEMBER'

export interface CommunityDto {
  id: string
  slug: string
  name: string
  description: string
  member_count: number
  created_at: string
  updated_at: string
}

export interface UserCommunityMembershipDto {
  community: CommunityDto
  /** Rôle côté API (non affiché sur la liste). */
  role: CommunityMemberRole
  joined_at: string
  /** Au plus un défi actif par communauté ; true = défi à faire pour l’utilisateur. */
  has_pending_defi: boolean
}
