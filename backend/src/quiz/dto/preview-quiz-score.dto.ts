import { ApiProperty } from '@nestjs/swagger';
import { IsObject } from 'class-validator';

export class PreviewQuizScoreDto {
  @ApiProperty({
    description:
      'Réponses partielles ou complètes du quiz. Clé = questionId, valeur = string | number | string[]. Peut être vide.',
    example: {
      'q-transport-mode': 'voiture_diesel_essence',
      'q-transport-distance': '50_100',
    },
  })
  @IsObject()
  answers!: Record<string, unknown>;
}
