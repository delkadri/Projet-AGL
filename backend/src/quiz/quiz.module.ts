import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizSeederService } from './quiz.seeder.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { QuizScoringService } from './quiz-scoring.service';
import { AdemeBaseCarboneService } from './ademe-base-carbone.service';
import { TransportScorer } from './scoring/scorers/transport.scorer';
import { HousingScorer } from './scoring/scorers/housing.scorer';
import { FoodScorer } from './scoring/scorers/food.scorer';
import { ConsumptionScorer } from './scoring/scorers/consumption.scorer';
import { DigitalScorer } from './scoring/scorers/digital.scorer';
import { ServicesScorer } from './scoring/scorers/services.scorer';

@Module({
  imports: [SupabaseModule],
  controllers: [QuizController],
  providers: [
    QuizSeederService,
    AdemeBaseCarboneService,
    TransportScorer,
    HousingScorer,
    FoodScorer,
    ConsumptionScorer,
    DigitalScorer,
    ServicesScorer,
    QuizScoringService,
  ],
})
export class QuizModule {}
