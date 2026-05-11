import { ApiProperty } from '@nestjs/swagger';

export class ChallengeDto {
  @ApiProperty({ description: 'ID du defi', example: 'b2fce9a9-8b6b-4c74-8b6c-6d0d5a4f9a21' })
  id!: string;

  @ApiProperty({ description: 'Titre du defi', example: 'Utiliser le velo pour un trajet court' })
  title!: string;

  @ApiProperty({ description: 'Description du defi', example: 'Remplacer un trajet en voiture par le velo cette semaine.' })
  description!: string;

  @ApiProperty({ description: 'Feuilles creditees a la completion', example: 10 })
  reward_feuilles!: number;

  @ApiProperty({
    description: 'Economie CO2 estimee en kg CO2 eq. (indicative uniquement)',
    example: 5.0,
  })
  co2_saving_estimate!: number;

  @ApiProperty({ description: 'Date de creation', example: '2026-03-16T18:30:00.000Z' })
  created_at!: Date;

  @ApiProperty({ description: 'Date de mise a jour', example: '2026-03-16T18:30:00.000Z' })
  updated_at!: Date;
}
