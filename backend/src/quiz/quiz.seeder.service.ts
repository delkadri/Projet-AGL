import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizSeederService implements OnModuleInit {
  private readonly logger = new Logger(QuizSeederService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

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

      const client = this.supabaseService.getClient();
      if (!client) {
        this.logger.error('Client Supabase non initialisé. Impossible de synchroniser le quiz.');
        return;
      }

      const { id, name, categories } = quizJson;

      const { error } = await client
        .from('quizzes')
        .upsert({
          id,
          name,
          content: { categories }
        });

      if (error) {
        this.logger.error(`Échec de la synchronisation du quiz '${id}': ${error.message}`);
      } else {
        this.logger.log(`Quiz '${id}' synchronisé avec succès sur Supabase.`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la synchronisation du quiz: ${error.message}`);
    }
  }
}
