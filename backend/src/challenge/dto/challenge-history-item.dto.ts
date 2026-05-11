import { ApiProperty } from '@nestjs/swagger';
import { ChallengeDto } from './challenge.dto';

export class ChallengeHistoryItemDto {
  @ApiProperty({ description: 'ID de l entree historique', example: '53dd8f4c-f968-4d1a-9b1c-6e7ab2c665c2' })
  id!: string;

  @ApiProperty({ description: 'Date de completion', example: '2026-03-16T18:30:00.000Z' })
  completed_at!: Date;

  @ApiProperty({ description: 'Defi associe' })
  challenge!: ChallengeDto;
}
