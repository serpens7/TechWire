import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * Сборка описания API.
 *
 * Вынесена отдельно от main.ts, потому что нужна дважды: для живой страницы
 * на /api и для файла openapi.json, из которого генерируются типы фронта.
 * Если бы её собирали в двух местах, документация и типы могли бы разойтись.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
    const config = new DocumentBuilder()
        .setTitle('TechWire API')
        .setDescription(
            [
                'Бэкенд статейной платформы.',
                '',
                'Имена query-параметров (`_limit`, `_page`, `_sort`, `_order`, `q`, `_expand`)',
                'унаследованы от json-server, который этот сервис заменил: так фронт не',
                'потребовал правок, а существующий набор e2e стал приёмочным тестом подмены.',
                '',
                'Все маршруты закрыты, кроме `POST /login` и `GET /health`.',
            ].join('\n'),
        )
        .setVersion('1.0')
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Токен из ответа POST /login',
        })
        .build();

    // nestjs-zod убирает из документа служебные артефакты, которые остаются
    // после превращения zod-схем в JSON Schema.
    return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}
