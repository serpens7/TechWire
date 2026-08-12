import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, ARTICLE_ID, USER, bearer, createTestApp, http, login } from './helpers';

describe('комментарии', () => {
    let app: NestFastifyApplication;
    let userToken: string;
    let userId: string;
    let adminId: string;

    beforeAll(async () => {
        app = await createTestApp();

        const user = await login(app, USER);
        userToken = user.token;
        userId = user.user.id;
        adminId = (await login(app, ADMIN)).user.id;
    });

    afterAll(async () => {
        await app.close();
    });

    it('отдаёт комментарии статьи с авторами и без паролей', async () => {
        const { body } = await http(app)
            .get(`/comments?articleId=${ARTICLE_ID}&_expand=user`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body.length).toBeGreaterThan(0);
        expect(body[0].user.username).toEqual(expect.any(String));
        expect(JSON.stringify(body)).not.toContain('password');
    });

    it('создаёт комментарий и он появляется в выборке', async () => {
        const text = `комментарий ${Date.now()}`;

        const created = await http(app)
            .post('/comments')
            .set(...bearer(userToken))
            .send({ articleId: ARTICLE_ID, text })
            .expect(201);

        expect(created.body).toMatchObject({ text, articleId: ARTICLE_ID });

        const { body } = await http(app)
            .get(`/comments?articleId=${ARTICLE_ID}&_expand=user`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body.map((c: { id: string }) => c.id)).toContain(created.body.id);
    });

    it('автором становится владелец токена, а не userId из тела', async () => {
        // Фронт присылает userId; json-server его использовал, то есть можно
        // было оставить комментарий от чужого имени.
        const { body } = await http(app)
            .post('/comments')
            .set(...bearer(userToken))
            .send({ articleId: ARTICLE_ID, text: 'подмена автора', userId: adminId })
            .expect(201);

        expect(body.userId).toBe(userId);
        expect(body.userId).not.toBe(adminId);
    });

    it.each([
        ['пустой текст', { text: '' }],
        ['текст из пробелов', { text: '   ' }],
        ['без статьи', { articleId: undefined }],
    ])('отвергает: %s', async (_label, patch) => {
        await http(app)
            .post('/comments')
            .set(...bearer(userToken))
            .send({ articleId: ARTICLE_ID, text: 'нормальный текст', ...patch })
            .expect(400);
    });

    it('к несуществующей статье отвечает 404', async () => {
        await http(app)
            .post('/comments')
            .set(...bearer(userToken))
            .send({ articleId: 'нет-такой', text: 'текст' })
            .expect(404);
    });

    it('без токена не создаётся', async () => {
        await http(app)
            .post('/comments')
            .send({ articleId: ARTICLE_ID, text: 'текст' })
            .expect(401);
    });
});
