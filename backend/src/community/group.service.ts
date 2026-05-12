import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from 'nestjs-prisma';
import { ChallengeService } from './challenge.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { InterCommunityLeaderboardEntryDto } from './dto/inter-community-leaderboard.dto';
import { UserGroupMembershipDto } from './dto/user-group-membership.dto';

@Injectable()
export class GroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly challengeService: ChallengeService,
  ) { }

  private async getUserLevel(userId: string): Promise<number> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    const level = await this.prisma.levels.findFirst({
      where: { required_feuilles: { lte: user.feuilles } },
      orderBy: { required_feuilles: 'desc' },
    });
    return level ? level.level_number : 1;
  }

  private async assertNotAlreadyMember(
    groupId: string,
    userId: string,
  ): Promise<void> {
    const existing = await this.prisma.group_members.findUnique({
      where: { group_id_user_id: { group_id: groupId, user_id: userId } },
    });
    if (existing) throw new ConflictException('Déjà membre de ce groupe');
  }

  async createGroup(userId: string, dto: CreateGroupDto): Promise<UserGroupMembershipDto> {
    const niveau = await this.getUserLevel(userId);
    if (niveau < 3) {
      throw new ForbiddenException('Niveau 3 requis pour créer un groupe');
    }

    const group = await this.prisma.groups.create({
      data: {
        name: dto.name,
        description: dto.description,
        is_public: dto.is_public,
        admin_id: userId,
        invite_code: randomUUID(),
      },
    });

    const membership = await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    await this.challengeService.assignWeeklyChallengeToGroup(group.id);

    return {
      community: {
        id: group.id,
        name: group.name,
        description: group.description ?? '',
        member_count: 1,
        is_private: !group.is_public,
        created_at: group.created_at.toISOString(),
        updated_at: group.updated_at.toISOString(),
      },
      role: 'ADMIN',
      joined_at: membership.joined_at.toISOString(),
      has_pending_defi: false,
    };
  }

  async joinGroupByName(userId: string, name: string) {
    const group = await this.prisma.groups.findFirst({
      where: { name, is_public: true },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    await this.assertNotAlreadyMember(group.id, userId);

    await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    return group;
  }

  async joinGroupByCode(userId: string, code: string) {
    const group = await this.prisma.groups.findFirst({
      where: { invite_code: code },
    });
    if (!group) throw new NotFoundException('Code invalide');

    await this.assertNotAlreadyMember(group.id, userId);

    await this.prisma.group_members.create({
      data: { group_id: group.id, user_id: userId },
    });

    return group;
  }

  async removeMember(
    adminId: string,
    groupId: string,
    targetUserId: string,
  ): Promise<void> {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.admin_id !== adminId) {
      throw new ForbiddenException("Action réservée à l'admin");
    }
    if (targetUserId === adminId) {
      throw new ForbiddenException("L'admin ne peut pas se supprimer");
    }

    await this.prisma.group_members.delete({
      where: {
        group_id_user_id: { group_id: groupId, user_id: targetUserId },
      },
    });
  }

  async deleteGroup(adminId: string, groupId: string): Promise<void> {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (group.admin_id !== adminId) {
      throw new ForbiddenException("Action réservée à l'admin");
    }

    await this.prisma.groups.delete({ where: { id: groupId } });
  }

  async checkGroupActive(
    groupId: string,
  ): Promise<{ groupId: string; isActive: boolean; memberCount: number }> {
    const memberCount = await this.prisma.group_members.count({
      where: { group_id: groupId },
    });
    return { groupId, isActive: memberCount >= 3, memberCount };
  }

  async searchGroups(name: string, userId: string) {
    const isFeatured = name.trim() === '';
    const groups = await this.prisma.groups.findMany({
      where: {
        is_public: true,
        ...(isFeatured ? {} : { name: { contains: name, mode: 'insensitive' } }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { members: true } },
        members: {
          where: { user_id: userId },
          select: { user_id: true },
        },
      },
      ...(isFeatured ? { take: 5 } : {}),
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description ?? '',
      visibility: 'public' as const,
      member_count: g._count.members,
      already_member: g.members.length > 0,
    }));
  }

  async joinGroupById(userId: string, groupId: string) {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');
    if (!group.is_public) {
      throw new ForbiddenException(
        "Ce groupe est privé, utilisez un code d'invitation",
      );
    }

    await this.assertNotAlreadyMember(groupId, userId);

    await this.prisma.group_members.create({
      data: { group_id: groupId, user_id: userId },
    });

    return group;
  }

  async getGroupDetails(groupId: string, userId: string) {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { first_name: true, last_name: true } },
          },
          orderBy: { arbres: 'desc' },
        },
        group_challenges: {
          where: {
            week_start_at: { gte: weekStart },
            week_end_at: { lte: weekEnd },
          },
          include: {
            challenge: true,
            completions: true,
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const activeChallenge = group.group_challenges[0] ?? null;
    const memberCount = group.members.length;

    const treeRanking = group.members.map((m, i) => ({
      rank: i + 1,
      user_id: m.user_id,
      display_name:
        [m.user.first_name, m.user.last_name].filter(Boolean).join(' ') ||
        'Anonyme',
      tree_score: m.arbres,
    }));

    const streakStatus =
      group.win_streak === 0
        ? 'broken'
        : group.last_streak_updated_at &&
          group.last_streak_updated_at >= weekStart
          ? 'active'
          : 'at_risk';

    const activeDefi = activeChallenge
      ? {
        id: activeChallenge.id,
        title: activeChallenge.challenge.title,
        description: activeChallenge.challenge.description,
        points: 0,
        iconKey: 'leaf' as const,
        ends_at: activeChallenge.week_end_at.toISOString(),
        bonus_feuilles: 500,
        members_completed: activeChallenge.completions.length,
        members_total_for_challenge: memberCount,
        current_user_completed: activeChallenge.completions.some(
          (c) => c.user_id === userId,
        ),
      }
      : null;

    return {
      community: {
        id: group.id,
        slug: group.id,
        name: group.name,
        description: group.description ?? '',
        member_count: memberCount,
        is_private: !group.is_public,
        created_at: group.created_at.toISOString(),
        updated_at: group.updated_at.toISOString(),
      },
      active_defi: activeDefi,
      win_streak: {
        count: group.win_streak,
        status: streakStatus,
        challenge_ends_at:
          activeChallenge?.week_end_at.toISOString() ??
          weekEnd.toISOString(),
        last_full_completion_at: null,
      },
      tree_ranking: treeRanking,
    };
  }

  async getLeaderboard(): Promise<InterCommunityLeaderboardEntryDto[]> {
    const groups = await this.prisma.groups.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        name: true,
        win_streak: true,
        last_streak_updated_at: true,
        members: {
          select: {
            user: {
              select: {
                score_history: { select: { score: true } },
              },
            },
          },
        },
        _count: { select: { members: true } },
      },
    });

    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);

    const entries = groups.map((group) => {
      const allScores = group.members.flatMap((m) =>
        m.user.score_history.map((s) => s.score),
      );
      const avg =
        allScores.length > 0
          ? allScores.reduce((a, b) => a + b, 0) / allScores.length
          : 0;

      let streakStatus: 'active' | 'at_risk' | 'broken';
      if (group.win_streak === 0) {
        streakStatus = 'broken';
      } else if (
        group.last_streak_updated_at &&
        group.last_streak_updated_at >= weekStart
      ) {
        streakStatus = 'active';
      } else {
        streakStatus = 'at_risk';
      }

      return {
        community: {
          id: group.id,
          slug: group.id,
          name: group.name,
          member_count: group._count.members,
        },
        average_carbon_tco2e_per_year: avg,
        win_streak: { count: group.win_streak, status: streakStatus },
      };
    });

    entries.sort((a, b) => {
      const diff =
        a.average_carbon_tco2e_per_year - b.average_carbon_tco2e_per_year;
      if (diff !== 0) return diff;
      return b.win_streak.count - a.win_streak.count;
    });

    return entries.map((entry, i) => ({ rank: i + 1, ...entry }));
  }

  async getMyGroups(userId: string): Promise<UserGroupMembershipDto[]> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);

    const memberships = await this.prisma.group_members.findMany({
      where: { user_id: userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
            is_public: true,
            admin_id: true,
            created_at: true,
            updated_at: true,
            _count: { select: { members: true } },
            group_challenges: {
              where: {
                week_start_at: { gte: weekStart },
                week_end_at: { lte: weekEnd },
              },
              select: {
                id: true,
                completions: {
                  where: { user_id: userId },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => {
      const weeklyChallenge = m.group.group_challenges[0] ?? null;
      return {
        community: {
          id: m.group.id,
          name: m.group.name,
          description: m.group.description ?? '',
          member_count: m.group._count.members,
          is_private: !m.group.is_public,
          created_at: m.group.created_at.toISOString(),
          updated_at: m.group.updated_at.toISOString(),
        },
        role: m.group.admin_id === userId ? 'ADMIN' : 'MEMBER',
        joined_at: m.joined_at.toISOString(),
        has_pending_defi:
          weeklyChallenge !== null &&
          weeklyChallenge.completions.length === 0,
      };
    });
  }
}
