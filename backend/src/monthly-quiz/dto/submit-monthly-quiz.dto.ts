import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject, IsObject } from 'class-validator';

export class SubmitMonthlyQuizDto {
  @ApiProperty({
    description:
      'Map des reponses du quiz mensuel. Cle = questionId, valeur = string | number | string[]',
    example: {
      'q-transport-mode': 'voiture_diesel_essence',
      'q-transport-distance': '50_100',
      'q-housing-surface': 45,
    },
  })
  @IsObject()
  @IsNotEmptyObject()
  answers!: Record<string, unknown>;
}
