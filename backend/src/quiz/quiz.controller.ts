import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CalculateQuizScoreDto } from './dto/calculate-quiz-score.dto';
import { QuizScoringService } from './quiz-scoring.service';

@Controller('quiz')
export class QuizController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly quizScoringService: QuizScoringService,
  ) {}

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    const client = this.supabaseService.getClient();
    if (!client) {
      throw new InternalServerErrorException('Supabase client not initialized');
    }

    const { data, error } = await client
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Quiz avec l'id '${id}' introuvable`);
    }

    // On reformate l'objet pour correspondre au type TypeScript 'Quiz' du front
    return {
      id: data.id,
      name: data.name,
      categories: data.content?.categories || []
    };
  }

  @Post(':id/score')
  async calculateScore(@Param('id') id: string, @Body() body: CalculateQuizScoreDto) {
    return this.quizScoringService.calculateScore(id, body.answers);
  }
}
