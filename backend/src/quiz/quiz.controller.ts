import { Controller, Get, Param, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly supabaseService: SupabaseService) {}

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
}
