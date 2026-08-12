import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { createTestApp, http } from './helpers';

/**
 * Единственный публичный маршрут со статьями.
 *
 * Смысл в том, чтобы главная что-то показывала незалогиненному посетителю,
 * не открывая при этом каталог: по этим данным статью прочитать нельзя.
 */
describe('тизеры главной', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await createTestApp();
    });

    afterAll(async () => {
        await app.close();
    });

    it('отдаётся без токена', async () => {
        const { body } = await http(app).get('/highlights').expect(200);

        expect(body).toHaveProperty('articleOfTheDay');
        expect(body).toHaveProperty('snippetOfTheDay');
    });

    it('статья дня — самая просматриваемая', async () => {
        const { body } = await http(app).get('/highlights').expect(200);

        expect(body.articleOfTheDay).toMatchObject({
            id: expect.any(String),
            title: expect.any(String),
            views: expect.any(Number),
            user: { username: expect.any(String) },
        });
    });

    it('в статье дня нет содержимого — это тизер', async () => {
        // Ключевая граница: если бы blocks приезжали, ограничение «войдите,
        // чтобы читать» было бы фикцией — текст уже был бы у клиента.
        const { body } = await http(app).get('/highlights').expect(200);

        expect(body.articleOfTheDay).not.toHaveProperty('blocks');
    });

    it('сниппет дня несёт код и минимум о статье', async () => {
        const { body } = await http(app).get('/highlights').expect(200);

        expect(body.snippetOfTheDay).toMatchObject({
            code: expect.any(String),
            article: { id: expect.any(String), title: expect.any(String) },
        });
        expect(body.snippetOfTheDay.article).not.toHaveProperty('blocks');
        expect(body.snippetOfTheDay.article).not.toHaveProperty('subtitle');
    });

    it('пароли не утекают', async () => {
        const { body } = await http(app).get('/highlights').expect(200);

        expect(JSON.stringify(body)).not.toContain('password');
    });

    it('остальные маршруты со статьями остались закрытыми', async () => {
        // Смысл тизеров именно в том, что они не открывают каталог.
        await http(app).get('/articles').expect(401);
        await http(app).get('/articles/1').expect(401);
    });
});
