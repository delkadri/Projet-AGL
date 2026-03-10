import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
    @ApiProperty({
        description: 'The email of the user',
        example: 'user@example.com',
    })
    @IsEmail()
    email!: string;

    @ApiProperty({
        description: 'The password of the user (min 6 characters)',
        example: 'password123',
        minLength: 6,
    })
    @IsNotEmpty()
    @MinLength(6)
    password!: string;
}
