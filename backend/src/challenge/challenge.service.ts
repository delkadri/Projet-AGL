import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ChallengeService {
  async getActiveChallenges(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { parcours: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const periodType = user.parcours?.period_type ?? 'WEEK';
    const defisPerPeriod = user.parcours?.defis_per_period ?? 0;
    const periodDays = periodType === 'DAY' ? 1 : 7;
    const periodStart = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    const weeklyChallenges = await prisma.challenges.findMany({
      where: { created_at: { gte: periodStart } },
      orderBy: { created_at: 'desc' },
    });

    const completed = await prisma.user_challenges.findMany({
      where: { user_id: userId },
      select: { challenge_id: true },
    });
    const completedIds = new Set(completed.map(c => c.challenge_id));

    const available = weeklyChallenges.filter(c => !completedIds.has(c.id));
    if (defisPerPeriod > 0) {
      return available.slice(0, defisPerPeriod);
    }

    return available;
  }

  async getWeeklyChallenges() {
    const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return prisma.challenges.findMany({
      where: { created_at: { gte: periodStart } },
      orderBy: { created_at: 'desc' },
    });
  }

  async getHistory(userId: string) {
    return prisma.user_challenges.findMany({
      where: { user_id: userId },
      include: { challenge: true },
      orderBy: { completed_at: 'desc' },
    });
  }

  async completeChallenge(userId: string, challengeId: string) {
    const challenge = await prisma.challenges.findUnique({
      where: { id: challengeId }
    });
    
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const existing = await prisma.user_challenges.findUnique({
      where: { user_id_challenge_id: { user_id: userId, challenge_id: challengeId } }
    });

    if (existing) {
      return {
        message: 'Already completed',
        addedFeuilles: 0,
        co2SavingEstimate: challenge.co2_saving_estimate,
      };
    }

    await prisma.$transaction([
      prisma.user_challenges.create({
        data: {
          user_id: userId,
          challenge_id: challengeId
        }
      }),
      prisma.users.update({
        where: { id: userId },
        data: { feuilles: { increment: challenge.reward_feuilles } }
      })
    ]);

    return {
      message: 'Challenge completed',
      addedFeuilles: challenge.reward_feuilles,
      co2SavingEstimate: challenge.co2_saving_estimate,
    };
  }
}
