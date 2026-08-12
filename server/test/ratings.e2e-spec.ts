import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, USER, UNRATED_ARTICLE_IDS, bearer, createTestApp, http, login } from './helpers';

describe('рейтинги', () => {
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

    // Каждый тест берёт свою статью: прогон пишет в общую базу, и переиспользование
    // одной статьи связало бы тесты между собой.
    const [FIRST, UPSERT, SPOOF, RANGE] = UNRATED_ARTICLE_IDS;

    it('на неоценённой статье отдаёт пустой массив', async () => {
        // Именно на пустоте фронт решает показать форму оценки, а не результат.
        const { body } = await http(app)
            .get(`/article-ratings?userId=${userId}&articleId=${FIRST}`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body).toEqual([]);
    });

    it('сохраняет оценку', async () => {
        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: FIRST, rate: 4, feedback: 'хорошая статья' })
            .expect(201);

        const { body } = await http(app)
            .get(`/article-ratings?userId=${userId}&articleId=${FIRST}`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ rate: 4, feedback: 'хорошая статья' });
    });

    it('повторная оценка перезаписывает, а не дублирует', async () => {
        // json-server на это место плодил дубли: уникального индекса на пару
        // пользователь+статья у него не было.
        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: UPSERT, rate: 5 })
            .expect(201);

        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: UPSERT, rate: 2, feedback: 'передумал' })
            .expect(201);

        const { body } = await http(app)
            .get(`/article-ratings?userId=${userId}&articleId=${UPSERT}`)
            .set(...bearer(userToken))
            .expect(200);

        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({ rate: 2, feedback: 'передумал' });
    });

    it('оценка записывается на владельца токена, а не на userId из тела', async () => {
        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: SPOOF, rate: 3, userId: adminId })
            .expect(201);

        const mine = await http(app)
            .get(`/article-ratings?userId=${userId}&articleId=${SPOOF}`)
            .set(...bearer(userToken))
            .expect(200);
        const foreign = await http(app)
            .get(`/article-ratings?userId=${adminId}&articleId=${SPOOF}`)
            .set(...bearer(userToken))
            .expect(200);

        expect(mine.body).toHaveLength(1);
        expect(foreign.body).toHaveLength(0);
    });

    it.each([
        ['оценка выше пяти', { rate: 99 }],
        ['оценка нулевая', { rate: 0 }],
        ['оценка отрицательная', { rate: -1 }],
        ['оценка дробная', { rate: 3.5 }],
        ['без статьи', { articleId: undefined }],
    ])('отвергает: %s', async (_label, patch) => {
        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: RANGE, rate: 4, ...patch })
            .expect(400);
    });

    it('к несуществующей статье отвечает 404', async () => {
        await http(app)
            .post('/article-ratings')
            .set(...bearer(userToken))
            .send({ articleId: 'нет-такой', rate: 4 })
            .expect(404);
    });
});
