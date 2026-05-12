import { ApiProperty } from '@nestjs/swagger';

export class ScoreHistoryCategoryDto {
  @ApiProperty({
    description: 'Identifiant de la catégorie',
    example: 'transport',
  })
  id!: string;

  @ApiProperty({ description: 'Libellé de la catégorie', example: 'Transport' })
  name!: string;

  @ApiProperty({
    description: 'Total kgCO2e/an pour cette catégorie',
    example: 2150.4,
  })
  totalKgCo2ePerYear!: number;
}

export class ScoreHistoryResponseDto {
  @ApiProperty({
    description: "ID de l'entrée d'historique",
    example: 'f839d-21cd-40b9-a212-32a2f81903fa',
  })
  id!: string;

  @ApiProperty({ description: 'Score carbone obtenu', example: 1450.5 })
  score!: number;

  @ApiProperty({
    description: "Date de l'enregistrement",
    example: '2026-03-16T18:30:00.000Z',
  })
  created_at!: Date;

  @ApiProperty({
    description:
      'Totaux par catégorie au moment de l’enregistrement (peut être null pour les anciennes entrées).',
    type: () => [ScoreHistoryCategoryDto],
    nullable: true,
    required: false,
  })
  categories_scores!: ScoreHistoryCategoryDto[] | null;
}
