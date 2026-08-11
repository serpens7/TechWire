import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

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
