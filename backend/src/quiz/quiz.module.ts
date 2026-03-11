import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizSeederService } from './quiz.seeder.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [QuizController],
  providers: [QuizSeederService],
})
export class QuizModule {}
