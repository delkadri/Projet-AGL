import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class ListMessagesQuery {
  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: '2026-05-11T12:34:56.000Z',
    description: 'Curseur de pagination : ISO date — renvoie les messages strictement antérieurs.',
  })
  @IsOptional()
  @IsISO8601()
  before?: string;
}
