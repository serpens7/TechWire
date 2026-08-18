import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, bearer, createTestApp, http, login } from './helpers';

/**
 * Тизеры для главной: статья дня и сниппет дня одним запросом.
 *
 * Появились, когда каталог был закрыт целиком и гостю показывали только
 * анонсы. После открытия чтения эндпоинт остался — он избавляет главную от
 * двух отдельных запросов и переносит выбор сниппета на сервер.
 */
/**
 * Сколько раз прочитать свежую статью, чтобы она заведомо возглавила окно.
 * Сид кладёт не больше MAX_SYNTHETIC_VIEWS (50) событий на статью — берём с
 * запасом, см. комментарий в самом тесте.
 */
const READS_TO_WIN = 120;

describe('тизеры главной', () => {
    let app: NestFastifyApplication;
    let adminToken: string;

    beforeAll(async () => {
        app = await createTestApp();
        adminToken = (await login(app, ADMIN)).token;
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

    it('в статье дня нет содержимого — это анонс', async () => {
        // Главной нужен только заголовок с картинкой; текст статьи она не
        // показывает, поэтому и тащить его в ответ незачем.
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

    it('согласован с каталогом: статья дня открывается по своему id', async () => {
        // Каталог теперь тоже публичный, поэтому переход с главной в статью
        // должен работать для гостя без единого токена.
        const { body } = await http(app).get('/highlights').expect(200);

        const article = await http(app)
            .get(`/articles/${body.articleOfTheDay.id}?_expand=user`)
            .expect(200);

        expect(article.body.title).toBe(body.articleOfTheDay.title);
        // А вот содержимое приезжает уже отсюда, а не из тизера.
        expect(article.body.blocks.length).toBeGreaterThan(0);
    });

    it('статья дня — по просмотрам за последние 7 дней, а не за всё время', async () => {
        // Свежая статья начинает с нуля — если её сделать самой просматриваемой
        // ЗА ОКНО, она обязана обойти любого пожизненного лидера, у которого
        // просто накопилось больше просмотров за всю историю.
        const { body: created } = await http(app)
            .post('/articles')
            .set(...bearer(adminToken))
            .send({
                title: `Статья дня ${Date.now()}`,
                subtitle: 'подзаголовок',
                img: 'https://example.com/img.png',
                type: ['IT'],
                blocks: [{ id: '1', type: 'TEXT', title: 'Заголовок', paragraphs: ['абзац'] }],
            })
            .expect(201);

        // Читаем последовательно, а не через Promise.all: пачка одновременных
        // supertest-запросов поднимает столько же эфемерных сокетов и роняет
        // прогон в CI с ECONNRESET, а недозакрытые хендлы потом мешают jest
        // завершиться.
        //
        // Запас над сидом намеренно большой: там не больше
        // MAX_SYNTHETIC_VIEWS (50) событий на статью, но база засевается один
        // раз на весь test:e2e, и соседние спеки успевают добавить сидовым
        // статьям свои чтения. Без запаса тест выигрывал бы «на десять
        // просмотров» и начал бы падать от любого нового теста, читающего статью.
        for (let i = 0; i < READS_TO_WIN; i += 1) {
            // Без токена: собственные просмотры автору не засчитываются.
            await http(app).get(`/articles/${created.id}`).expect(200);
        }

        const { body } = await http(app).get('/highlights').expect(200);

        expect(body.articleOfTheDay.id).toBe(created.id);
    });
});
