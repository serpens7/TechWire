/**
 * Пишет описание API в openapi.json.
 *
 * Файл коммитится: из него генерируются типы фронта, и в CI проверяется, что
 * пересборка не даёт расхождений — то есть нельзя поменять контракт и забыть
 * обновить типы.
 *
 * Приложение поднимается в preview-режиме: Nest сканирует контроллеры, но не
 * создаёт провайдеров, поэтому подключение к БД не требуется и скрипт работает
 * на любой машине.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/openapi';

const OUT = resolve(__dirname, '../openapi.json');

async function main(): Promise<void> {
    // Адаптер передаётся явно: платформа по умолчанию — express, а он из
    // проекта удалён в пользу Fastify.
    const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
        preview: true,
        logger: false,
    });

    const document = buildOpenApiDocument(app);
    const paths = Object.keys(document.paths ?? {});
    const schemas = Object.keys(document.components?.schemas ?? {});

    if (paths.length === 0) {
        throw new Error('В документе нет ни одного маршрута — сканирование не сработало');
    }

    // Перевод строки в конце и стабильный отступ — чтобы diff файла отражал
    // изменения контракта, а не форматирования.
    writeFileSync(OUT, `${JSON.stringify(document, null, 2)}\n`, 'utf-8');

    console.log(`openapi.json обновлён: маршрутов ${paths.length}, схем ${schemas.length}`);

    await app.close();
}

void main();
