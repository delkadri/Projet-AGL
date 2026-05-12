import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

const CHALLENGE_COMPLETION_FEUILLES = 20;
const GROUP_BONUS_FEUILLES = 50;
const RECENT_CHALLENGE_WEEKS = 4;

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) { }

  private getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
    weekEnd.setUTCHours(23, 59, 59, 999);
    return { weekStart, weekEnd };
  }

  async assignWeeklyChallengeToGroup(groupId: string) {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const { weekStart, weekEnd } = this.getCurrentWeekBounds();
    const cutoffDate = new Date(weekStart);
    cutoffDate.setUTCDate(weekStart.getUTCDate() - RECENT_CHALLENGE_WEEKS * 7);

    const recentlyUsed = await this.prisma.group_challenges.findMany({
      where: {
        group_id: groupId,
        week_start_at: { gte: cutoffDate },
      },
      select: { challenge_id: true },
    });
    const excludedIds = recentlyUsed.map((gc) => gc.challenge_id);

    let candidates = await this.prisma.challenges.findMany({
      where: excludedIds.length > 0 ? { id: { notIn: excludedIds } } : {},
    });

    if (candidates.length === 0) {
      candidates = await this.prisma.challenges.findMany();
    }

    if (candidates.length === 0) {
      throw new NotFoundException('Aucun défi disponible');
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    return this.prisma.group_challenges.create({
      data: {
        group_id: groupId,
        challenge_id: chosen.id,
        week_start_at: weekStart,
        week_end_at: weekEnd,
      },
    });
  }

  async completeGroupChallenge(userId: string, groupChallengeId: string) {
    const groupChallenge = await this.prisma.group_challenges.findUnique({
      where: { id: groupChallengeId },
    });
    if (!groupChallenge) {
      throw new NotFoundException('Défi de groupe non trouvé');
    }

    const membership = await this.prisma.group_members.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupChallenge.group_id,
          user_id: userId,
        },
      },
    });
    if (!membership) {
      throw new NotFoundException("Vous n'êtes pas membre de ce groupe");
    }

    const existing = await this.prisma.group_challenge_completions.findUnique({
      where: {
        group_challenge_id_user_id: {
          group_challenge_id: groupChallengeId,
          user_id: userId,
        },
      },
    });
    if (existing) {
      throw new ConflictException('Défi déjà complété');
    }

    const completion = await this.prisma.group_challenge_completions.create({
      data: { group_challenge_id: groupChallengeId, user_id: userId },
    });

    await this.prisma.users.update({
      where: { id: userId },
      data: { feuilles: { increment: CHALLENGE_COMPLETION_FEUILLES } },
    });

    await this.prisma.group_members.update({
      where: {
        group_id_user_id: {
          group_id: groupChallenge.group_id,
          user_id: userId,
        },
      },
      data: { arbres: { increment: 1 } },
    });

    const [totalMembers, totalCompletions] = await Promise.all([
      this.prisma.group_members.count({
        where: { group_id: groupChallenge.group_id },
      }),
      this.prisma.group_challenge_completions.count({
        where: { group_challenge_id: groupChallengeId },
      }),
    ]);

    if (totalCompletions >= totalMembers) {
      await this.awardGroupBonus(groupChallenge.group_id);
    }

    return completion;
  }

  async awardGroupBonus(groupId: string) {
    const members = await this.prisma.group_members.findMany({
      where: { group_id: groupId },
      select: { user_id: true },
    });

    const userIds = members.map((m) => m.user_id);

    await this.prisma.users.updateMany({
      where: { id: { in: userIds } },
      data: { feuilles: { increment: GROUP_BONUS_FEUILLES } },
    });

    await this.prisma.groups.update({
      where: { id: groupId },
      data: {
        win_streak: { increment: 1 },
        last_streak_updated_at: new Date(),
      },
    });
  }

  async resetGroupStreak(groupId: string) {
    const { weekStart, weekEnd } = this.getCurrentWeekBounds();

    const groupChallenge = await this.prisma.group_challenges.findFirst({
      where: {
        group_id: groupId,
        week_start_at: { gte: weekStart },
        week_end_at: { lte: weekEnd },
      },
    });

    if (!groupChallenge) {
      await this.prisma.groups.update({
        where: { id: groupId },
        data: { win_streak: 0 },
      });
      return;
    }

    const [totalMembers, totalCompletions] = await Promise.all([
      this.prisma.group_members.count({ where: { group_id: groupId } }),
      this.prisma.group_challenge_completions.count({
        where: { group_challenge_id: groupChallenge.id },
      }),
    ]);

    if (totalCompletions < totalMembers) {
      await this.prisma.groups.update({
        where: { id: groupId },
        data: { win_streak: 0 },
      });
    }
  }

  async assignWeeklyChallengesToAllGroups() {
    const groups = await this.prisma.groups.findMany({
      where: { status: 'active' },
    });

    await Promise.allSettled(
      groups.map((g) => this.assignWeeklyChallengeToGroup(g.id)),
    );
  }

  async processWeeklyStreakResets() {
    const groups = await this.prisma.groups.findMany({
      where: { status: 'active' },
    });

    await Promise.allSettled(groups.map((g) => this.resetGroupStreak(g.id)));
  }

  async resetGroupRankings() {
    await this.prisma.group_members.updateMany({
      data: { arbres: 0 },
    });
  }

  async getGroupCurrentChallenge(groupId: string) {
    const group = await this.prisma.groups.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Groupe non trouvé');

    const { weekStart, weekEnd } = this.getCurrentWeekBounds();

    const groupChallenge = await this.prisma.group_challenges.findFirst({
      where: {
        group_id: groupId,
        week_start_at: { gte: weekStart },
        week_end_at: { lte: weekEnd },
      },
      include: { challenge: true },
    });

    if (!groupChallenge) {
      throw new NotFoundException('Aucun défi assigné pour cette semaine');
    }

    const [completedCount, totalMembers] = await Promise.all([
      this.prisma.group_challenge_completions.count({
        where: { group_challenge_id: groupChallenge.id },
      }),
      this.prisma.group_members.count({ where: { group_id: groupId } }),
    ]);

    return {
      groupChallengeId: groupChallenge.id,
      challenge: groupChallenge.challenge,
      weekStartAt: groupChallenge.week_start_at,
      weekEndAt: groupChallenge.week_end_at,
      completedCount,
      totalMembers,
      progressRatio: totalMembers > 0 ? completedCount / totalMembers : 0,
    };
  }

  async completeCurrentWeekChallenge(userId: string, groupId: string) {
    const { weekStart, weekEnd } = this.getCurrentWeekBounds();

    const groupChallenge = await this.prisma.group_challenges.findFirst({
      where: {
        group_id: groupId,
        week_start_at: { gte: weekStart },
        week_end_at: { lte: weekEnd },
      },
    });

    if (!groupChallenge) {
      throw new NotFoundException('Aucun défi assigné pour cette semaine');
    }

    return this.completeGroupChallenge(userId, groupChallenge.id);
  }

  getNextRankingReset(): Date {
    const now = new Date();
    const year = now.getUTCFullYear();
    const resetMonths = [0, 3, 6, 9]; // Jan, Apr, Jul, Oct

    for (const month of resetMonths) {
      const candidate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      if (candidate > now) return candidate;
    }

    return new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  }
}
