import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { INDIVIDUAL_CHALLENGE_FEUILLES } from '../rewards.constants';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async updateParcours(userId: string, parcoursId: string) {
    const parcours = await this.prisma.parcours.findUnique({
      where: { id: parcoursId },
    });

    if (!parcours) {
      throw new NotFoundException('Parcours non trouvé');
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: { parcours_id: parcoursId },
    });
  }

  async addFeuilles(userId: string, feuillesToAdd: number) {
    return this.prisma.users.update({
      where: { id: userId },
      data: {
        feuilles: { increment: feuillesToAdd },
      },
    });
  }

  /** Défi « simple » (carte Accueil) : +INDIVIDUAL_CHALLENGE_FEUILLES, une fois par jour UTC. */
  async completeSimpleDailyChallenge(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, last_simple_challenge_completed_at: true },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const now = new Date();
    const startOfUtcDay = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (
      user.last_simple_challenge_completed_at &&
      user.last_simple_challenge_completed_at >= startOfUtcDay
    ) {
      throw new ConflictException('Défi déjà relevé aujourd’hui');
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: {
        feuilles: { increment: INDIVIDUAL_CHALLENGE_FEUILLES },
        last_simple_challenge_completed_at: now,
      },
      select: { feuilles: true, last_simple_challenge_completed_at: true },
    });

    return {
      feuilles: updated.feuilles,
      lastSimpleChallengeCompletedAt:
        updated.last_simple_challenge_completed_at!.toISOString(),
    };
  }

  async completeOnboarding(userId: string) {
    return this.prisma.users.update({
      where: { id: userId },
      data: { onboarding_completed: true },
    });
  }

  async getScoreHistory(userId: string) {
    return this.prisma.score_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        score: true,
        categories_scores: true,
        created_at: true,
      },
    });
  }

  /** Réinitialise l’onboarding et efface les scores enregistrés (refaire le quiz). */
  async resetOnboardingForRetest(userId: string) {
    await this.prisma.$transaction([
      this.prisma.score_history.deleteMany({ where: { user_id: userId } }),
      this.prisma.monthlyQuiz.deleteMany({ where: { userId } }),
      this.prisma.users.update({
        where: { id: userId },
        data: {
          onboarding_completed: false,
          lastMonthlyQuizAt: null,
          nextMonthlyQuizAt: null,
        },
      }),
    ]);
    return { ok: true as const };
  }
}
