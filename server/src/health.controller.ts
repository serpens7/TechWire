import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { HealthDto } from './common/serialization/schemas';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    // Проверка живости должна отвечать без токена — иначе ею не сможет
    // пользоваться ни Playwright, ни любой внешний мониторинг.
    @ApiOperation({ summary: 'Живость сервиса и доступность БД' })
    @ApiOkResponse({ type: HealthDto })
    @Public()

    /**
     * Проверка живости вместе с доступностью БД. Пригодится Playwright'у,
     * который ждёт готовности стека перед прогоном e2e.
     */
    @Get()
    async check(): Promise<{ status: string; db: string }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;

            return { status: 'ok', db: 'up' };
        } catch {
            return { status: 'degraded', db: 'down' };
        }
    }
}
