import { ApiProperty } from '@nestjs/swagger';

export class ParcoursDto {
    @ApiProperty({ example: 'de879435-0ee4-42db-84f0-4150fa0593f3' })
    id!: string;

    @ApiProperty({ example: 'decouverte' })
    slug!: string;

    @ApiProperty({ example: 'DÉCOUVERTE' })
    name!: string;

    @ApiProperty({ example: 'L’essentiel rapidement. Comprendre mon score sans surcharge avec des défis simples.' })
    description!: string;

    @ApiProperty({ example: 1 })
    defis_per_period!: number;

    @ApiProperty({ example: 1 })
    quizz_per_period!: number;

    @ApiProperty({ example: 'WEEK' })
    period_type!: string;
}

export class UserProfileResponseDto {
    @ApiProperty({ example: 'dc147d80-0ee4-42db-84f0-4150fa0593f3' })
    id!: string;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiProperty({ required: false, nullable: true, example: 'Jean' })
    firstName!: string | null;

    @ApiProperty({ required: false, nullable: true, example: 'Dupont' })
    lastName!: string | null;

    @ApiProperty({ example: 450 })
    feuilles!: number;

    @ApiProperty({ example: 5 })
    niveau!: number;

    @ApiProperty({ example: true })
    onboardingCompleted!: boolean;

    @ApiProperty({ type: ParcoursDto, required: false, nullable: true })
    parcours!: ParcoursDto | null;
}
