import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('health')
export class HealthController {
    constructor(private readonly supabaseService: SupabaseService) { }

    @Get()
    getHealth() {
        return { status: 'ok' };
    }

    @Get('supabase')
    getSupabaseStatus() {
        const client = this.supabaseService.getClient();
        return {
            status: client ? 'initialized' : 'failed',
        };
    }
}
