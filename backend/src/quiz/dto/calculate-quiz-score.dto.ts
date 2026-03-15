import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmptyObject, IsObject } from 'class-validator';

export class CalculateQuizScoreDto {
  @ApiProperty({
    description:
      'Map des reponses du quiz. Cle = questionId, valeur = string | number | string[]',
    example: {
      q1: 'voiture_diesel_essence',
      q2: '50_100',
      q3: ['voiture', 'train'],
      q4: 2,
      q4b: 'moyen',
      q5: '1d',
    },
  })
  @IsObject()
  @IsNotEmptyObject()
  answers!: Record<string, unknown>;
}
