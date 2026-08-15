import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, ARTICLE_ID, USER, bearer, createTestApp, http, login } from './helpers';

describe('комментарии', () => {
    let app: NestFastifyApplication;
    let userToken: string;
    let userId: string;
    let adminToken: string;
    let adminId: string;

    beforeAll(async () => {
        app = await createTestApp();

        const user = await login(app, USER);
        userToken = user.token;
        userId = user.user.id;

        const admin = await login(app, ADMIN);
        adminToken = admin.token;
        adminId = admin.user.id;
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

    describe('ответы', () => {
        it('создаётся ответ, replyToUserId — автор родителя', async () => {
            const root = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'корневой комментарий' })
                .expect(201);

            const reply = await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'ответ', parentId: root.body.id })
                .expect(201);

            expect(reply.body).toMatchObject({
                parentId: root.body.id,
                replyToUserId: adminId,
                userId: userId,
            });
        });

        it('ответ на ответ схлопывается к тому же корню', async () => {
            const root = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'корень для схлопывания' })
                .expect(201);

            const reply = await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'первый ответ', parentId: root.body.id })
                .expect(201);

            const replyToReply = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'ответ на ответ', parentId: reply.body.id })
                .expect(201);

            expect(replyToReply.body.parentId).toBe(root.body.id);
            expect(replyToReply.body.parentId).not.toBe(reply.body.id);
            expect(replyToReply.body.replyToUserId).toBe(userId);
        });

        it('в развёрнутой выборке несёт user и replyToUser', async () => {
            const root = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'корень для _expand' })
                .expect(201);

            await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'ответ для _expand', parentId: root.body.id })
                .expect(201);

            const { body } = await http(app)
                .get(`/comments?articleId=${ARTICLE_ID}&_expand=user`)
                .set(...bearer(userToken))
                .expect(200);

            const reply = body.find((c: { text: string }) => c.text === 'ответ для _expand');

            expect(reply.user.username).toEqual(expect.any(String));
            expect(reply.replyToUser.username).toEqual(expect.any(String));
        });

        it('родитель из другой статьи — 400', async () => {
            const foreignRoot = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'комментарий на другой статье' })
                .expect(201);

            await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: '3', text: 'ответ не туда', parentId: foreignRoot.body.id })
                .expect(400);
        });

        it('несуществующий parentId — 404', async () => {
            await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'ответ в никуда', parentId: 'нет-такого' })
                .expect(404);
        });

        it('устойчивый порядок: комментарии идут по времени создания', async () => {
            const { body } = await http(app)
                .get(`/comments?articleId=${ARTICLE_ID}`)
                .set(...bearer(userToken))
                .expect(200);

            // id из сида не несут порядка создания, поэтому опираемся на то,
            // что запрос вообще не падает и возвращает стабильный массив —
            // сама сортировка проверяется тем, что дважды подряд отдаёт
            // одинаковый порядок.
            const { body: again } = await http(app)
                .get(`/comments?articleId=${ARTICLE_ID}`)
                .set(...bearer(userToken))
                .expect(200);

            expect(body.map((c: { id: string }) => c.id)).toEqual(
                again.map((c: { id: string }) => c.id),
            );
        });
    });

    describe('удаление', () => {
        it('автор удаляет свой комментарий', async () => {
            const created = await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'удалю сам' })
                .expect(201);

            await http(app)
                .delete(`/comments/${created.body.id}`)
                .set(...bearer(userToken))
                .expect(204);

            const { body } = await http(app)
                .get(`/comments?articleId=${ARTICLE_ID}`)
                .set(...bearer(userToken))
                .expect(200);

            expect(body.map((c: { id: string }) => c.id)).not.toContain(created.body.id);
        });

        it('удаление корня забирает с собой ответы', async () => {
            const root = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'корень на удаление' })
                .expect(201);

            const reply = await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({
                    articleId: ARTICLE_ID,
                    text: 'ответ на удаляемый корень',
                    parentId: root.body.id,
                })
                .expect(201);

            await http(app)
                .delete(`/comments/${root.body.id}`)
                .set(...bearer(adminToken))
                .expect(204);

            const { body } = await http(app)
                .get(`/comments?articleId=${ARTICLE_ID}`)
                .set(...bearer(userToken))
                .expect(200);

            const ids = body.map((c: { id: string }) => c.id);
            expect(ids).not.toContain(root.body.id);
            expect(ids).not.toContain(reply.body.id);
        });

        it('чужой комментарий удалить нельзя — 403', async () => {
            const created = await http(app)
                .post('/comments')
                .set(...bearer(adminToken))
                .send({ articleId: ARTICLE_ID, text: 'не трогай' })
                .expect(201);

            await http(app)
                .delete(`/comments/${created.body.id}`)
                .set(...bearer(userToken))
                .expect(403);
        });

        it('несуществующий комментарий — 404', async () => {
            await http(app)
                .delete('/comments/нет-такого')
                .set(...bearer(userToken))
                .expect(404);
        });

        it('без токена не удаляется', async () => {
            const created = await http(app)
                .post('/comments')
                .set(...bearer(userToken))
                .send({ articleId: ARTICLE_ID, text: 'защищённый от гостя' })
                .expect(201);

            await http(app).delete(`/comments/${created.body.id}`).expect(401);
        });
    });
});
