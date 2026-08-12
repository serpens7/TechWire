import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { buildOpenApiDocument } from './openapi';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

    const config = app.get(ConfigService);
    const port = Number(config.get('PORT') ?? 8000);

    // Фронт живёт на :3000 (webpack-dev-server), бэк на :8000 — это
    // cross-origin, поэтому CORS обязателен. Authorization нужен для JWT.
    app.enableCors({
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Живая документация. Сама страница защиты не требует — она лишь
    // описывает контракт, а каждый запрос из неё всё равно пойдёт через
    // обычные гварды.
    SwaggerModule.setup('api', app, buildOpenApiDocument(app));

    await app.listen(port, '0.0.0.0');

    console.log(`Бэкенд слушает http://localhost:${port}`);
    console.log(`Документация API: http://localhost:${port}/api`);
}

void bootstrap();
