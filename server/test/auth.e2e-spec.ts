import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, USER, bearer, createTestApp, http, login } from './helpers';

/**
 * Авторизация и закрытость маршрутов по умолчанию.
 *
 * До перехода на настоящий бэкенд «токеном» был сам объект пользователя,
 * который фронт клал в localStorage и слал в заголовке, а json-server лишь
 * проверял, что заголовок непустой. Сессия подделывалась правкой devtools.
 * Эти тесты фиксируют, что так больше нельзя.
 */
describe('авторизация', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('вход', () => {
        it('пускает с верными учётными данными и выдаёт токен', async () => {
            const { body } = await http(app).post('/login').send(ADMIN).expect(200);

            expect(body.token).toEqual(expect.any(String));
            expect(body.user).toMatchObject({ username: 'admin', roles: ['ADMIN'] });
        });

        it('не отдаёт пароль в ответе', async () => {
            const { body } = await http(app).post('/login').send(ADMIN).expect(200);

            expect(body.user).not.toHaveProperty('password');
            expect(JSON.stringify(body)).not.toContain(ADMIN.password);
        });

        it('кладёт в токен идентификатор, логин и роли — но не пароль', async () => {
            const { body } = await http(app).post('/login').send(ADMIN).expect(200);
            const payload = JSON.parse(Buffer.from(body.token.split('.')[1], 'base64').toString());

            expect(payload).toMatchObject({ username: 'admin', roles: ['ADMIN'] });
            expect(payload.sub).toEqual(expect.any(String));
            expect(payload.exp).toBeGreaterThan(payload.iat);
            expect(JSON.stringify(payload).toLowerCase()).not.toContain('password');
        });

        it('отвергает неверный пароль', async () => {
            await http(app)
                .post('/login')
                .send({ username: ADMIN.username, password: 'неверный' })
                .expect(401);
        });

        it('отвечает одинаково на неверный пароль и несуществующий логин', async () => {
            // Иначе эндпоинт превращается в способ перечислить занятые логины.
            const wrongPassword = await http(app)
                .post('/login')
                .send({ username: ADMIN.username, password: 'неверный' });
            const noSuchUser = await http(app)
                .post('/login')
                .send({ username: 'нет-такого-пользователя', password: '123' });

            expect(noSuchUser.status).toBe(wrongPassword.status);
            expect(noSuchUser.body.message).toBe(wrongPassword.body.message);
        });

        it('требует оба поля', async () => {
            await http(app).post('/login').send({ username: 'admin' }).expect(400);
            await http(app).post('/login').send({}).expect(400);
        });
    });

    describe('закрытость по умолчанию', () => {
        it.each([
            ['/articles'],
            ['/articles/1'],
            ['/comments?articleId=1'],
            ['/notifications?userId=1'],
            ['/article-ratings?userId=1&articleId=1'],
            ['/profile/1'],
            ['/auth/me'],
        ])('без токена не отдаёт %s', async (path) => {
            await http(app).get(path).expect(401);
        });

        it.each([
            ['битый токен', 'Bearer not-a-real-token'],
            [
                'подделанная подпись',
                'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwicm9sZXMiOlsiQURNSU4iXX0.forged',
            ],
            ['без схемы Bearer', 'plain-string'],
            ['пустой Bearer', 'Bearer '],
        ])('отвергает %s', async (_label, header) => {
            await http(app).get('/articles').set('authorization', header).expect(401);
        });

        it('проверка живости доступна без токена', async () => {
            const { body } = await http(app).get('/health').expect(200);

            expect(body).toEqual({ status: 'ok', db: 'up' });
        });
    });

    describe('доступ с токеном', () => {
        it('пускает к защищённым маршрутам', async () => {
            const { token } = await login(app, USER);

            await http(app)
                .get('/articles?_limit=3')
                .set(...bearer(token))
                .expect(200);
        });

        it('/auth/me возвращает владельца токена', async () => {
            const { token, user } = await login(app, ADMIN);

            const { body } = await http(app)
                .get('/auth/me')
                .set(...bearer(token))
                .expect(200);

            expect(body).toMatchObject({ id: user.id, username: 'admin', roles: ['ADMIN'] });
        });
    });
});
