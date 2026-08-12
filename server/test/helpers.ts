import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Учётки из сида (json-server/db.json). Пары логин/пароль намеренно не
 * менялись при переходе на bcrypt — на них завязаны и эти тесты, и e2e.
 */
export const ADMIN = { username: 'admin', password: '123' };
export const USER = { username: 'user2', password: '321' };

/**
 * Статьи в сиде имеют НЕ сплошные id: 1, 3, 18…51. Тесты, которым нужна
 * заведомо не оценённая статья, берут их отсюда — admin в сиде уже оценил
 * статьи 1, 28 и 29.
 */
export const ARTICLE_ID = '1';
export const UNRATED_ARTICLE_IDS = ['34', '35', '36', '37', '38'];

export async function createTestApp(): Promise<NestFastifyApplication> {
    // Искусственная задержка ответа нужна фронту, но в тестах это только
    // потерянные секунды. ConfigModule не перетирает уже заданный process.env.
    process.env.RESPONSE_DELAY_MS = '0';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await app.init();
    // Fastify поднимается асинхронно: без ready() supertest получит
    // недоинициализированный сервер.
    await app.getHttpAdapter().getInstance().ready();

    return app;
}

export function http(app: NestFastifyApplication) {
    return request(app.getHttpServer());
}

/** Возвращает токен и пользователя — большинству тестов нужно и то, и другое. */
export async function login(
    app: NestFastifyApplication,
    credentials: typeof ADMIN,
): Promise<{ token: string; user: { id: string; username: string; roles: string[] } }> {
    const response = await http(app).post('/login').send(credentials).expect(200);

    return response.body;
}

export function bearer(token: string): [string, string] {
    return ['authorization', `Bearer ${token}`];
}
