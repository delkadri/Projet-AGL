import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Les Éco-Warriors' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Groupe dédié aux défis écologiques',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_public: boolean;
}
