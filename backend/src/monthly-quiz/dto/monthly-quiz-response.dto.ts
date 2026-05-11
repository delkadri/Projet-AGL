import { ApiProperty } from '@nestjs/swagger';

export class MonthlyQuizOptionDto {
  @ApiProperty({ example: 'Voiture individuelle' })
  label!: string;

  @ApiProperty({ example: 'voiture_diesel_essence' })
  value!: string;

  @ApiProperty({ required: false, example: 'Le mode le plus emetteur.' })
  description?: string;
}

export class MonthlyQuizQuestionDto {
  @ApiProperty({ example: 'q-transport-mode' })
  id!: string;

  @ApiProperty({ example: 'single' })
  type!: string;

  @ApiProperty({ example: 'Comment vous rendez-vous au travail ?' })
  title!: string;

  @ApiProperty({ required: false, example: 'Le transport represente ~30 %.' })
  description?: string;

  @ApiProperty({ required: false, type: [MonthlyQuizOptionDto] })
  options?: MonthlyQuizOptionDto[];

  @ApiProperty({ required: false, example: 0 })
  min?: number;

  @ApiProperty({ required: false, example: 30 })
  max?: number;

  @ApiProperty({ required: false, type: Object })
  showIf?: Record<string, unknown>;

  @ApiProperty({ required: false, type: Object })
  carbonMeta?: Record<string, unknown>;
}

export class MonthlyQuizCategoryDto {
  @ApiProperty({ example: 'cat-transport' })
  id!: string;

  @ApiProperty({ example: 'MOBILITE & TRANSPORT' })
  name!: string;

  @ApiProperty({ type: [MonthlyQuizQuestionDto] })
  questions!: MonthlyQuizQuestionDto[];
}

export class MonthlyQuizResponseDto {
  @ApiProperty({ example: 'quiz-1' })
  id!: string;

  @ApiProperty({ example: 'Bilan carbone' })
  name!: string;

  @ApiProperty({ type: [MonthlyQuizCategoryDto] })
  categories!: MonthlyQuizCategoryDto[];
}
