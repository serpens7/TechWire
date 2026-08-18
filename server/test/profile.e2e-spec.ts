import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, USER, bearer, createTestApp, http, login } from './helpers';

describe('профиль', () => {
    let app: NestFastifyApplication;
    let adminToken: string;
    let userToken: string;

    beforeAll(async () => {
        app = await createTestApp();

        adminToken = (await login(app, ADMIN)).token;
        userToken = (await login(app, USER)).token;
    });

    afterAll(async () => {
        await app.close();
    });

    it('отдаёт профиль, склеивая username и avatar из пользователя', async () => {
        // В db.json эти поля дублировались в users и profile; в базе они
        // живут только у пользователя, а в ответе собираются обратно.
        const { body } = await http(app)
            .get('/profile/1')
            .set(...bearer(userToken))
            .expect(200);

        expect(body).toMatchObject({ id: '1', username: 'admin' });
        expect(body.avatar).toEqual(expect.any(String));
    });

    it('на несуществующий отвечает 404', async () => {
        await http(app)
            .get('/profile/99999')
            .set(...bearer(userToken))
            .expect(404);
    });

    it('правит свой профиль', async () => {
        const { body } = await http(app)
            .put('/profile/1')
            .set(...bearer(adminToken))
            .send({
                first: 'Иван',
                lastname: 'Петров',
                age: 26,
                city: 'Saint-Petersburg',
                currency: 'EUR',
                country: 'Russia',
            })
            .expect(200);

        expect(body).toMatchObject({ age: 26, currency: 'EUR', city: 'Saint-Petersburg' });
    });

    it('сохраняет и отдаёт статус', async () => {
        const status = 'Пью кофе и пишу код';

        const { body } = await http(app)
            .put('/profile/1')
            .set(...bearer(adminToken))
            .send({ status })
            .expect(200);

        expect(body.status).toBe(status);

        const fetched = await http(app)
            .get('/profile/1')
            .set(...bearer(adminToken))
            .expect(200);

        expect(fetched.body.status).toBe(status);
    });

    it('изменения сохраняются', async () => {
        await http(app)
            .put('/profile/1')
            .set(...bearer(adminToken))
            .send({ first: 'Иван', age: 33 })
            .expect(200);

        const { body } = await http(app)
            .get('/profile/1')
            .set(...bearer(adminToken))
            .expect(200);

        expect(body.age).toBe(33);
    });

    it('чужой профиль править нельзя', async () => {
        // На фронте кнопка правки просто спрятана — это UX, а не запрет.
        await http(app)
            .put('/profile/2')
            .set(...bearer(adminToken))
            .send({ first: 'Взлом' })
            .expect(403);
    });

    it('занятый логин отвергается с 409', async () => {
        await http(app)
            .put('/profile/1')
            .set(...bearer(adminToken))
            .send({ username: USER.username })
            .expect(409);
    });

    it.each([
        ['отрицательный возраст', { age: -5 }],
        ['неправдоподобный возраст', { age: 500 }],
        ['неизвестная валюта', { currency: 'BTC' }],
        ['неизвестная страна', { country: 'Atlantis' }],
        ['пустой логин', { username: '' }],
        ['слишком длинный статус', { status: 'a'.repeat(201) }],
    ])('отвергает: %s', async (_label, patch) => {
        await http(app)
            .put('/profile/1')
            .set(...bearer(adminToken))
            .send(patch)
            .expect(400);
    });

    it('без токена не правится', async () => {
        await http(app).put('/profile/1').send({ first: 'Аноним' }).expect(401);
    });
});
