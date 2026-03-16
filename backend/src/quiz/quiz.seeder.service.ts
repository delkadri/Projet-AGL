import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizSeederService implements OnModuleInit {
  private readonly logger = new Logger(QuizSeederService.name);

  constructor(private readonly prisma: PrismaService) { }

  async onModuleInit() {
    this.logger.log('Démarrage de la synchronisation du quiz...');
    try {
      let filePath = path.join(process.cwd(), 'src', 'quiz', 'data', 'quiz-init.json');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'data', 'quiz-init.json');
      }

      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Fichier quiz-init.json introuvable (${filePath}).`);
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const quizJson = JSON.parse(fileContent);

      const { id, name, categories } = quizJson;
      const firstQuestionId = categories?.[0]?.questions?.[0]?.id ?? '?';
      this.logger.log(`[Seeder] Synchronisation de '${id}' — première question: ${firstQuestionId}`);

      await this.prisma.quizzes.upsert({
        where: { id },
        update: {
          name,
          content: { categories }
        },
        create: {
          id,
          name,
          content: { categories }
        }
      });

      this.logger.log(`Quiz '${id}' synchronisé avec succès sur Supabase via Prisma.`);
    } catch (error: any) {
      this.logger.error(`Erreur lors de la synchronisation du quiz: ${error.message}`);
    }
  }
}
