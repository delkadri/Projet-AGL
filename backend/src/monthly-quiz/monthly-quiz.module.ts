import { Module } from '@nestjs/common';
import { QuizModule } from '../quiz/quiz.module';
import { MonthlyQuizController } from './monthly-quiz.controller';

@Module({
  imports: [QuizModule],
  controllers: [MonthlyQuizController],
})
export class MonthlyQuizModule {}
