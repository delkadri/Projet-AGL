import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: 'Check API health status' })
    @ApiResponse({ status: 200, description: 'API is healthy' })
    getHealth() {
        return { status: 'ok' };
    }

    @Get('database')
    @ApiOperation({ summary: 'Check Database connection status' })
    @ApiResponse({ status: 200, description: 'Database status retrieved' })
    async getDatabaseStatus() {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'initialized' };
        } catch (e) {
            return { status: 'failed' };
        }
    }
}
