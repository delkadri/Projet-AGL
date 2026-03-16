import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        this.logger.log('Démarrage de la synchronisation des données de base (Parcours, Niveaux)...');
        try {
            await this.seedParcours();
            await this.seedLevels();
            this.logger.log('Synchronisation des données de base terminée.');
        } catch (error: any) {
            this.logger.error(`Erreur lors de la synchronisation des données: ${error.message}`);
        }
    }

    private async seedParcours() {
        const parcours = [
            {
                slug: 'decouverte',
                name: 'DÉCOUVERTE',
                description: 'L’essentiel rapidement. Comprendre mon score sans surcharge avec des défis simples.',
                defis_per_period: 1,
                quizz_per_period: 1,
                period_type: 'WEEK'
            },
            {
                slug: 'progression',
                name: 'PROGRESSION',
                description: 'Engagement régulier. Suivi et défis personnalisés.',
                defis_per_period: 3,
                quizz_per_period: 3,
                period_type: 'WEEK'
            },
            {
                slug: 'challenge',
                name: 'CHALLENGE',
                description: 'Dynamique sociale. Objectifs et défis motivants',
                defis_per_period: 1,
                quizz_per_period: 1,
                period_type: 'DAY'
            }
        ];

        for (const p of parcours) {
            await this.prisma.parcours.upsert({
                where: { slug: p.slug },
                update: p,
                create: p,
            });
        }
        this.logger.log('Parcours insérés/mis à jour.');
    }

    private async seedLevels() {
        const maxLevel = 10;
        const interval = 100;

        for (let i = 1; i <= maxLevel; i++) {
            const required_feuilles = (i - 1) * interval;
            await this.prisma.levels.upsert({
                where: { level_number: i },
                update: { required_feuilles },
                create: { level_number: i, required_feuilles },
            });
        }
        this.logger.log('Niveaux insérés/mis à jour.');
    }
}
