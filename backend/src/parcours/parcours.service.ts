import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ParcoursService {
    constructor(private readonly prisma: PrismaService) { }

    async getAllParcours() {
        return this.prisma.parcours.findMany({
            orderBy: { created_at: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                description: true,
                defis_per_period: true,
                quizz_per_period: true,
                period_type: true
            }
        }); // Retourne tous les parcours existants avec leurs informations
    }
}
