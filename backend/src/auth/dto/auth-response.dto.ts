import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({ example: 'dc147d80-0ee4-42db-84f0-4150fa0593f3' })
    id!: string;

    @ApiProperty({ example: 'user@example.com' })
    email!: string;

    @ApiProperty({ required: false })
    email_confirmed_at?: string;

    @ApiProperty({ required: false })
    last_sign_in_at?: string;
}

export class SessionDto {
    @ApiProperty()
    access_token!: string;

    @ApiProperty({ example: 'bearer' })
    token_type!: string;

    @ApiProperty({ example: 3600 })
    expires_in!: number;

    @ApiProperty()
    expires_at!: number;
}

export class AuthResponseDto {
    @ApiProperty({ type: UserDto })
    user!: UserDto;

    @ApiProperty({ type: SessionDto, required: false })
    session?: SessionDto;
}
