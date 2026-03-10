import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly supabaseService: SupabaseService) { }

    @Get()
    @ApiOperation({ summary: 'Check API health status' })
    @ApiResponse({ status: 200, description: 'API is healthy' })
    getHealth() {
        return { status: 'ok' };
    }

    @Get('supabase')
    @ApiOperation({ summary: 'Check Supabase connection status' })
    @ApiResponse({ status: 200, description: 'Supabase status retrieved' })
    getSupabaseStatus() {
        const client = this.supabaseService.getClient();
        return {
            status: client ? 'initialized' : 'failed',
        };
    }
}
