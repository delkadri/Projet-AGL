import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    constructor(private readonly supabaseService: SupabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || typeof authHeader !== 'string') {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const parts = authHeader.trim().split(/\s+/);
        if (parts.length < 2 || parts[0].toLowerCase() !== 'bearer') {
            throw new UnauthorizedException('Invalid token format');
        }
        const token = parts[1];
        if (!token) {
            throw new UnauthorizedException('Invalid token format');
        }

        const client = this.supabaseService.getClient();
        if (!client) {
            throw new UnauthorizedException('Supabase client not initialized');
        }

        try {
            const { data, error } = await client.auth.getUser(token);

            if (error || !data?.user) {
                throw new UnauthorizedException(error?.message ?? 'Invalid or expired token');
            }

            request.user = data.user;
            return true;
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
