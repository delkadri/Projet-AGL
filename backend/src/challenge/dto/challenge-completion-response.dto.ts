import { ApiProperty } from '@nestjs/swagger';

export class ChallengeCompletionResponseDto {
  @ApiProperty({ description: 'Message de resultat', example: 'Challenge completed' })
  message!: string;

  @ApiProperty({ description: 'Feuilles creditees', example: 10 })
  addedFeuilles!: number;

  @ApiProperty({
    description: 'Economie CO2 estimee en kg CO2 eq. (indicative uniquement)',
    example: 5.0,
  })
  co2SavingEstimate!: number;
}
