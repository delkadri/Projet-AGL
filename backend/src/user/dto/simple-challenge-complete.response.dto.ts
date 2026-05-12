import { ApiProperty } from '@nestjs/swagger';

export class SimpleChallengeCompleteResponseDto {
  @ApiProperty({ example: 550 })
  feuilles!: number;

  @ApiProperty({ example: '2026-05-12T10:00:00.000Z' })
  lastSimpleChallengeCompletedAt!: string;
}
