import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class QuizSeederService implements OnModuleInit {
  private readonly logger = new Logger(QuizSeederService.name);

  constructor(private readonly supabaseService: SupabaseService) { }

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
      const firstQuestionId = categories?.[0]?.questions?.[0]?.id ?? '?';
      this.logger.log(`[Seeder] Synchronisation de '${id}' — première question: ${firstQuestionId}`);

      // Vérifie si le quiz existe déjà
      const { data: existing } = await client
        .from('quizzes')
        .select('id')
        .eq('id', id)
        .maybeSingle();

      let error: { message: string } | null = null;

      if (existing) {
        // Mise à jour forcée du contenu
        const { error: updateError } = await client
          .from('quizzes')
          .update({ name, content: { categories } })
          .eq('id', id);
        error = updateError;
        if (!error) this.logger.log(`[Seeder] Quiz '${id}' mis à jour dans Supabase.`);
      } else {
        // Première insertion
        const { error: insertError } = await client
          .from('quizzes')
          .insert({ id, name, content: { categories } });
        error = insertError;
        if (!error) this.logger.log(`[Seeder] Quiz '${id}' inséré dans Supabase.`);
      }

      if (error) {
        this.logger.error(`Échec de la synchronisation du quiz '${id}': ${error.message}`);
      }
    } catch (error: any) {
      this.logger.error(`Erreur lors de la synchronisation du quiz: ${error.message}`);
    }
  }
}
