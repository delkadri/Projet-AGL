import { ApiProperty } from '@nestjs/swagger';

export class ScoreHistoryResponseDto {
    @ApiProperty({ description: 'ID de l\'entrée d\'historique', example: 'f839d-21cd-40b9-a212-32a2f81903fa' })
    id!: string;

    @ApiProperty({ description: 'Score carbone obtenu', example: 1450.5 })
    score!: number;

    @ApiProperty({ description: 'Date de l\'enregistrement', example: '2026-03-16T18:30:00.000Z' })
    created_at!: Date;
}
