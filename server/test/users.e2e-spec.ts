import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, http } from './helpers';

/**
 * Публичная карточка автора. Появилась, чтобы клик по имени автора в статье
 * или комментарии вёл куда-то — раньше вело в никуда: /profile/:id закрыт
 * токеном и предназначен только для редактирования собственного профиля.
 */
describe('публичная карточка автора', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('отдаётся без токена', async () => {
        const { body } = await http(app).get('/users/1').expect(200);

        expect(body).toMatchObject({ id: '1', username: 'admin' });
    });

    it('на несуществующего отвечает 404', async () => {
        await http(app).get('/users/99999').expect(404);
    });

    it('не отдаёт пароль и личные данные', async () => {
        const { body } = await http(app).get('/users/1').expect(200);

        expect(JSON.stringify(body)).not.toContain('password');
        expect(body).not.toHaveProperty('age');
        expect(body).not.toHaveProperty('currency');
        expect(body).not.toHaveProperty('country');
        expect(body).not.toHaveProperty('city');
    });

    it('articlesCount совпадает с длиной /articles?userId=', async () => {
        const { body: author } = await http(app).get('/users/1').expect(200);

        const { body: articles } = await http(app).get('/articles?userId=1&_limit=100').expect(200);

        expect(author.articlesCount).toBe(articles.length);
    });

    it('/articles?userId= отдаёт только статьи этого автора', async () => {
        const { body: articles } = await http(app)
            .get('/articles?userId=2&_limit=100&_expand=user')
            .expect(200);

        expect(articles.length).toBeGreaterThan(0);
        articles.forEach((article: { user: { id: string } }) => {
            expect(article.user.id).toBe('2');
        });
    });
});
