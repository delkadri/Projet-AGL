import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

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
                created_at: true,
            }
        });
    }
}
