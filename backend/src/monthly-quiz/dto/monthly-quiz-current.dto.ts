import { ApiProperty } from '@nestjs/swagger';
import { MonthlyQuizResponseDto } from './monthly-quiz-response.dto';

/** Fraîcheur des données par rapport au dernier enregistrement score_history. */
export type MonthlyQuizDataFreshness = 'none' | 'recent' | 'stale';

export class MonthlyQuizCurrentDto {
  @ApiProperty({
    type: MonthlyQuizResponseDto,
    nullable: true,
    description:
      'Sous-quiz du mois (4 catégories) si une mise à jour est possible ce mois-ci, sinon null.',
  })
  quiz!: MonthlyQuizResponseDto | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Date ISO du dernier score enregistré (score_history.created_at).',
    example: '2026-05-01T12:00:00.000Z',
  })
  lastScoreHistoryAt!: string | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description:
      'Prochaine ouverture prévue du quiz mensuel (users.next_monthly_quiz_at), renseignée après une soumission.',
  })
  nextMonthlyQuizAt!: string | null;

  @ApiProperty({
    enum: ['none', 'recent', 'stale'],
    description:
      'none = aucun historique, recent = dernier score ≤ 21 jours, stale = dernier score > 21 jours.',
  })
  dataFreshness!: MonthlyQuizDataFreshness;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    description:
      'Réponses du dernier enregistrement (score_history) pour préremplir l’UI et résoudre les showIf ; le POST submit n’envoie que les questions mises à jour.',
  })
  baselineAnswers!: Record<string, unknown> | null;
}
