import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private readonly supabaseService: SupabaseService) { }

    async register(registerDto: RegisterDto) {
        const { email, password } = registerDto;
        const client = this.supabaseService.getClient();

        if (!client) {
            throw new BadRequestException('Supabase client not initialized');
        }

        const { data, error } = await client.auth.signUp({
            email,
            password,
        });

        if (error) {
            throw new BadRequestException(error.message);
        }

        return {
            user: {
                id: data.user?.id,
                email: data.user?.email,
                email_confirmed_at: data.user?.email_confirmed_at,
                last_sign_in_at: data.user?.last_sign_in_at,
            },
            session: data.session ? {
                access_token: data.session.access_token,
                token_type: data.session.token_type,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at,
            } : undefined,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const client = this.supabaseService.getClient();

        if (!client) {
            throw new BadRequestException('Supabase client not initialized');
        }

        const { data, error } = await client.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            throw new UnauthorizedException(error.message);
        }

        return {
            user: {
                id: data.user?.id,
                email: data.user?.email,
                email_confirmed_at: data.user?.email_confirmed_at,
                last_sign_in_at: data.user?.last_sign_in_at,
            },
            session: data.session ? {
                access_token: data.session.access_token,
                token_type: data.session.token_type,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at,
            } : undefined,
        };
    }
}
