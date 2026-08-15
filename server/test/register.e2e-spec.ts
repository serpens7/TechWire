import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, bearer, createTestApp, http } from './helpers';

/**
 * Регистрация. До этой ветки завести аккаунт было негде — только сидовые
 * admin/user2. Каждый запущенный тест берёт уникальный логин, чтобы не
 * зависеть от порядка и не конфликтовать при повторных прогонах в одной БД.
 */
describe('регистрация', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    function uniqueUsername(): string {
        return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    }

    it('создаёт пользователя и сразу выдаёт рабочий токен', async () => {
        const username = uniqueUsername();

        const { body } = await http(app)
            .post('/register')
            .send({ username, password: 'password123' })
            .expect(201);

        expect(body.token).toEqual(expect.any(String));
        expect(body.user).toMatchObject({ username, roles: ['USER'] });

        // Токен не косметический — им реально можно пройти на закрытый маршрут.
        await http(app)
            .get('/auth/me')
            .set(...bearer(body.token))
            .expect(200);
    });

    it('не отдаёт пароль в ответе', async () => {
        const { body } = await http(app)
            .post('/register')
            .send({ username: uniqueUsername(), password: 'password123' })
            .expect(201);

        expect(body.user).not.toHaveProperty('password');
        expect(JSON.stringify(body)).not.toContain('password123');
    });

    it('сразу создаёт профиль, доступный по id пользователя', async () => {
        const { body } = await http(app)
            .post('/register')
            .send({ username: uniqueUsername(), password: 'password123' })
            .expect(201);

        // /profile/:id ключуется id профиля, а фронт всюду подставляет id
        // пользователя — они обязаны совпасть, иначе это 404 на своём же профиле.
        const profile = await http(app)
            .get(`/profile/${body.user.id}`)
            .set(...bearer(body.token))
            .expect(200);

        expect(profile.body).toMatchObject({ id: body.user.id, username: body.user.username });
    });

    it('отвергает занятый логин', async () => {
        await http(app)
            .post('/register')
            .send({ username: ADMIN.username, password: 'password123' })
            .expect(409);
    });

    it.each([
        ['короткий логин', { username: 'ab', password: 'password123' }],
        ['логин с запрещёнными символами', { username: 'bad username!', password: 'password123' }],
        ['короткий пароль', { username: uniqueUsername(), password: '123' }],
        ['без пароля', { username: uniqueUsername() }],
        ['без логина', { password: 'password123' }],
    ])('отвергает %s', async (_label, body) => {
        await http(app).post('/register').send(body).expect(400);
    });
});
