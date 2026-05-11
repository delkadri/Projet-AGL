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
            await this.seedChallenges();
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

    private async seedChallenges() {
        const parcoursList = await this.prisma.parcours.findMany({
            select: { id: true, slug: true },
        });
        const parcoursBySlug = new Map(parcoursList.map((p) => [p.slug, p.id]));

        const challenges = [
            {
                title: 'Trajet court a pied',
                description: 'Effectuer un trajet de moins de 2 km sans voiture.',
                category: 'mobilite',
                frequency: 'daily' as const,
                co2_saved_kg: 0.5,
                feuilles: 3,
                parcoursSlug: null,
            },
            {
                title: 'Repas vegetarien',
                description: 'Remplacer un repas avec viande par une option vegetarienne.',
                category: 'alimentation',
                frequency: 'weekly' as const,
                co2_saved_kg: 2.5,
                feuilles: 6,
                parcoursSlug: null,
            },
            {
                title: 'Energie en veille',
                description: 'Deconnecter les appareils en veille pendant une journee.',
                category: 'energie',
                frequency: 'daily' as const,
                co2_saved_kg: 0.2,
                feuilles: 2,
                parcoursSlug: null,
            },
            {
                title: 'Zero bouteille plastique',
                description: 'Utiliser une gourde reutilisable toute la semaine.',
                category: 'dechets',
                frequency: 'weekly' as const,
                co2_saved_kg: 1.2,
                feuilles: 4,
                parcoursSlug: 'decouverte',
            },
            {
                title: 'Courses de saison',
                description: 'Acheter uniquement des fruits et legumes de saison.',
                category: 'alimentation',
                frequency: 'weekly' as const,
                co2_saved_kg: 1.8,
                feuilles: 5,
                parcoursSlug: 'progression',
            },
            {
                title: 'Defi covoiturage',
                description: 'Organiser au moins un trajet en covoiturage.',
                category: 'mobilite',
                frequency: 'monthly' as const,
                co2_saved_kg: 8,
                feuilles: 10,
                parcoursSlug: 'challenge',
            },
        ];

        for (const c of challenges) {
            const parcoursId = c.parcoursSlug ? parcoursBySlug.get(c.parcoursSlug) ?? null : null;

            if (parcoursId) {
                await this.prisma.challenges.upsert({
                    where: {
                        title_parcours_id_frequency: {
                            title: c.title,
                            parcours_id: parcoursId,
                            frequency: c.frequency as any,
                        },
                    },
                    update: {
                        description: c.description,
                        category: c.category,
                        co2_saved_kg: c.co2_saved_kg,
                        feuilles: c.feuilles,
                        parcours_id: parcoursId,
                    },
                    create: {
                        title: c.title,
                        description: c.description,
                        category: c.category,
                        frequency: c.frequency as any,
                        co2_saved_kg: c.co2_saved_kg,
                        feuilles: c.feuilles,
                        parcours_id: parcoursId,
                    },
                });
            } else {
                const existing = await this.prisma.challenges.findFirst({
                    where: {
                        title: c.title,
                        parcours_id: null,
                        frequency: c.frequency as any,
                    }
                });

                if (existing) {
                    await this.prisma.challenges.update({
                        where: { id: existing.id },
                        data: {
                            description: c.description,
                            category: c.category,
                            co2_saved_kg: c.co2_saved_kg,
                            feuilles: c.feuilles,
                            parcours_id: null,
                        }
                    });
                } else {
                    await this.prisma.challenges.create({
                        data: {
                            title: c.title,
                            description: c.description,
                            category: c.category,
                            frequency: c.frequency as any,
                            co2_saved_kg: c.co2_saved_kg,
                            feuilles: c.feuilles,
                            parcours_id: null,
                        }
                    });
                }
            }
        }

        this.logger.log('Defis insers/mis a jour.');
    }
}
