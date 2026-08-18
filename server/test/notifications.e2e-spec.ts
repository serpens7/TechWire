import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, USER, bearer, createTestApp, http, login } from './helpers';

describe('уведомления', () => {
    let app: NestFastifyApplication;
    let userToken: string;
    let adminId: string;

    beforeAll(async () => {
        app = await createTestApp();

        userToken = (await login(app, USER)).token;
        adminId = (await login(app, ADMIN)).user.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('отдаёт уведомления пользователя', async () => {
        // Фронт опрашивает этот эндпоинт раз в 5 секунд, пока открыт Popover.
        const { body } = await http(app)
            .get(`/notifications?userId=${adminId}`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body.length).toBeGreaterThan(0);
        expect(body[0]).toMatchObject({
            userId: adminId,
            title: expect.any(String),
            isViewed: expect.any(Boolean),
        });
    });

    it('фильтрует по пользователю', async () => {
        const { body } = await http(app)
            .get('/notifications?userId=нет-такого')
            .set(...bearer(userToken))
            .expect(200);

        expect(body).toEqual([]);
    });

    it('без токена не отдаёт', async () => {
        await http(app).get(`/notifications?userId=${adminId}`).expect(401);
    });
});
