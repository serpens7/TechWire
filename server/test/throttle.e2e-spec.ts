import { Test } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ADMIN } from './helpers';

/**
 * Ограничение попыток входа.
 *
 * Собирает своё приложение (не через createTestApp — тот намеренно задирает
 * AUTH_THROTTLE_LIMIT до 1000, чтобы не мешать остальным спекам, которые
 * логинятся в своих beforeAll).
 */
describe('троттлинг входа', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        process.env.RESPONSE_DELAY_MS = '0';
        process.env.AUTH_THROTTLE_LIMIT = '3';
        process.env.AUTH_THROTTLE_TTL_MS = '60000';

        const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

        app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        await app.close();
        delete process.env.AUTH_THROTTLE_LIMIT;
        delete process.env.AUTH_THROTTLE_TTL_MS;
    });

    function http() {
        return request(app.getHttpServer());
    }

    it('пропускает попытки в пределах лимита и блокирует сверх него', async () => {
        for (let i = 0; i < 3; i += 1) {
            await http()
                .post('/login')
                .send({ username: ADMIN.username, password: 'неверный' })
                .expect(401);
        }

        await http()
            .post('/login')
            .send({ username: ADMIN.username, password: 'неверный' })
            .expect(429);
    });

    it('лимит общий и на верный пароль тоже', async () => {
        // Предыдущий тест уже исчерпал лимит для этого окна (троттлер общий на
        // всё приложение в тестовом процессе), поэтому даже верный пароль
        // блокируется — иначе перебор просто переключился бы на угадывание с
        // паузами.
        await http().post('/login').send(ADMIN).expect(429);
    });
});
