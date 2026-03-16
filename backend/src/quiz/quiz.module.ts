import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizSeederService } from './quiz.seeder.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { QuizScoringService } from './quiz-scoring.service';
import { AdemeBaseCarboneService } from './ademe-base-carbone.service';

@Module({
  imports: [SupabaseModule],
  controllers: [QuizController],
  providers: [QuizSeederService, QuizScoringService, AdemeBaseCarboneService],
})
export class QuizModule {}
