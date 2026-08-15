import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ADMIN, USER, bearer, createTestApp, http, login } from './helpers';

/**
 * Контракт чтения статей и права на запись.
 *
 * Отдельно закреплены три отличия от json-server, которые появились
 * осознанно и были подтверждены сравнением ответов обоих бэкендов:
 * пароли не утекают, фильтр по типу учитывает многотиповые статьи,
 * поиск ограничен заголовком и подзаголовком.
 */
describe('статьи', () => {
    let app: NestFastifyApplication;
    let adminToken: string;
    let adminId: string;
    let userToken: string;

    beforeAll(async () => {
        app = await createTestApp();

        const admin = await login(app, ADMIN);
        adminToken = admin.token;
        adminId = admin.user.id;
        userToken = (await login(app, USER)).token;
    });

    afterAll(async () => {
        await app.close();
    });

    const newArticle = () => ({
        title: `Статья ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        subtitle: 'подзаголовок',
        img: 'https://example.com/img.png',
        type: ['IT'],
        views: 0,
        createdAt: '11.08.2026',
        blocks: [{ id: '1', type: 'TEXT', title: 'Заголовок', paragraphs: ['абзац'] }],
    });

    describe('список', () => {
        it('отдаёт страницу нужного размера', async () => {
            const { body } = await http(app)
                .get('/articles?_limit=4&_page=1&_sort=createdAt&_order=asc')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toHaveLength(4);
        });

        it('листает: вторая страница не повторяет первую', async () => {
            const url = '/articles?_limit=4&_sort=createdAt&_order=asc';
            const first = await http(app)
                .get(`${url}&_page=1`)
                .set(...bearer(userToken));
            const second = await http(app)
                .get(`${url}&_page=2`)
                .set(...bearer(userToken));

            const firstIds = first.body.map((a: { id: string }) => a.id);
            const secondIds = second.body.map((a: { id: string }) => a.id);

            expect(firstIds).not.toEqual(secondIds);
            expect(firstIds.filter((id: string) => secondIds.includes(id))).toHaveLength(0);
        });

        it('за пределами страниц отдаёт пустой массив, а не ошибку', async () => {
            const { body } = await http(app)
                .get('/articles?_limit=12&_page=99')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toEqual([]);
        });

        it('сортирует по дате по-настоящему, а не лексически', async () => {
            // В db.json дата лежала строкой "DD.MM.YYYY", из-за чего
            // json-server сравнивал её как текст.
            const { body } = await http(app)
                .get('/articles?_limit=50&_sort=createdAt&_order=asc')
                .set(...bearer(userToken))
                .expect(200);

            const years = body.map((a: { createdAt: string }) => Number(a.createdAt.slice(-4)));

            expect(years).toEqual([...years].sort((a, b) => a - b));
        });

        it('сортирует по просмотрам по убыванию', async () => {
            const { body } = await http(app)
                .get('/articles?_limit=10&_sort=views&_order=desc')
                .set(...bearer(userToken))
                .expect(200);

            const views = body.map((a: { views: number }) => a.views);

            expect(views).toEqual([...views].sort((a, b) => b - a));
        });

        it('фильтр по типу учитывает статьи с несколькими типами', async () => {
            // Ключевое отличие от json-server: он сравнивал массив type
            // целиком, поэтому статья ["ECONOMICS","IT"] не попадала ни под
            // один фильтр. Таких статей 6 из 36 — они были невидимы.
            const { body } = await http(app)
                .get('/articles?_limit=50&type=IT')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toHaveLength(22);
            expect(body.every((a: { type: string[] }) => a.type.includes('IT'))).toBe(true);
            expect(body.some((a: { type: string[] }) => a.type.length > 1)).toBe(true);
        });

        it('ищет по заголовку и подзаголовку, но не по коду внутри блоков', async () => {
            const { body } = await http(app)
                .get('/articles?_limit=50&q=Javascript')
                .set(...bearer(userToken))
                .expect(200);

            // json-server искал по всему содержимому и возвращал 19 из 36 —
            // совпадения приходились на примеры кода.
            expect(body).toHaveLength(2);
        });

        it('пустые параметры означают «фильтр не задан»', async () => {
            // axios отправляет q= при пустом поиске, а не опускает параметр.
            const { body } = await http(app)
                .get('/articles?_limit=5&q=&type=&_sort=')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toHaveLength(5);
        });

        it('_expand=user разворачивает автора и не отдаёт его пароль', async () => {
            const { body } = await http(app)
                .get('/articles?_limit=3&_expand=user')
                .set(...bearer(userToken))
                .expect(200);

            expect(body[0].user).toMatchObject({ username: expect.any(String) });
            expect(body[0].user).not.toHaveProperty('password');
            expect(JSON.stringify(body)).not.toContain('password');
        });

        it.each([
            ['_limit не число', '/articles?_limit=abc'],
            ['_limit сверх максимума', '/articles?_limit=999'],
            ['_page нулевая', '/articles?_page=0'],
            ['сортировка по чужой колонке', '/articles?_sort=password'],
            ['неизвестный тип', '/articles?type=WRONG'],
        ])('отвергает %s', async (_label, url) => {
            await http(app)
                .get(url)
                .set(...bearer(userToken))
                .expect(400);
        });
    });

    describe('одна статья', () => {
        it('отдаёт статью с автором', async () => {
            const { body } = await http(app)
                .get('/articles/1?_expand=user')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toMatchObject({ id: '1', title: 'Javascript news' });
            expect(body.user.username).toEqual(expect.any(String));
        });

        it('без _expand отдаёт userId вместо автора — это путь редактирования', async () => {
            const { body } = await http(app)
                .get('/articles/1')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).not.toHaveProperty('user');
            expect(body.userId).toEqual(expect.any(String));
        });

        it('дату отдаёт в формате DD.MM.YYYY', async () => {
            const { body } = await http(app)
                .get('/articles/1')
                .set(...bearer(userToken))
                .expect(200);

            expect(body.createdAt).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
        });

        it('на несуществующую отвечает 404', async () => {
            await http(app)
                .get('/articles/99999')
                .set(...bearer(userToken))
                .expect(404);
        });
    });

    describe('токен на публичном маршруте — необязателен', () => {
        // JwtAuthGuard на @Public() маршрутах пытается разобрать токен (чтобы
        // знать читателя — например, не засчитывать автору просмотр своей же
        // статьи), но ошибка разбора не должна ронять запрос: маршрут публичный.
        it.each([
            ['без заголовка вовсе', undefined],
            ['битый токен', 'Bearer not-a-real-token'],
            ['без схемы Bearer', 'plain-string'],
        ])('отдаёт статью, даже если Authorization %s', async (_label, header) => {
            const req = http(app).get('/articles/1');

            if (header) req.set('authorization', header);

            const { body } = await req.expect(200);

            expect(body).toMatchObject({ id: '1' });
        });

        it('с валидным токеном ведёт себя как обычно', async () => {
            const { body } = await http(app)
                .get('/articles/1')
                .set(...bearer(userToken))
                .expect(200);

            expect(body).toMatchObject({ id: '1' });
        });
    });

    describe('создание', () => {
        it('обычному пользователю запрещено', async () => {
            await http(app)
                .post('/articles')
                .set(...bearer(userToken))
                .send(newArticle())
                .expect(403);
        });

        it('админ создаёт статью', async () => {
            const data = newArticle();
            const { body } = await http(app)
                .post('/articles')
                .set(...bearer(adminToken))
                .send(data)
                .expect(201);

            expect(body).toMatchObject({
                title: data.title,
                subtitle: data.subtitle,
                createdAt: '11.08.2026',
            });
            expect(body.blocks).toHaveLength(1);
        });

        it('автором становится владелец токена, а не userId из тела', async () => {
            // Фронт присылает userId; json-server его послушно использовал,
            // то есть можно было опубликовать статью от чужого имени.
            const { body } = await http(app)
                .post('/articles')
                .set(...bearer(adminToken))
                .send({ ...newArticle(), userId: 'кто-то-другой' })
                .expect(201);

            expect(body.userId).toBe(adminId);
        });

        it('созданная статья сразу читается', async () => {
            const data = newArticle();
            const created = await http(app)
                .post('/articles')
                .set(...bearer(adminToken))
                .send(data)
                .expect(201);

            const { body } = await http(app)
                .get(`/articles/${created.body.id}`)
                .set(...bearer(userToken))
                .expect(200);

            expect(body.title).toBe(data.title);
        });

        it.each([
            ['пустой заголовок', { title: '' }],
            ['без типов', { type: [] }],
            ['неизвестный тип', { type: ['WRONG'] }],
            ['блок CODE без поля code', { blocks: [{ id: '1', type: 'CODE' }] }],
            ['блок неизвестного типа', { blocks: [{ id: '1', type: 'VIDEO' }] }],
            ['дата в чужом формате', { createdAt: '2026-08-11' }],
        ])('отвергает: %s', async (_label, patch) => {
            await http(app)
                .post('/articles')
                .set(...bearer(adminToken))
                .send({ ...newArticle(), ...patch })
                .expect(400);
        });
    });

    describe('правка', () => {
        let articleId: string;

        beforeAll(async () => {
            const { body } = await http(app)
                .post('/articles')
                .set(...bearer(adminToken))
                .send(newArticle())
                .expect(201);

            articleId = body.id;
        });

        it('обычному пользователю запрещена', async () => {
            await http(app)
                .put(`/articles/${articleId}`)
                .set(...bearer(userToken))
                .send({ ...newArticle(), title: 'взлом' })
                .expect(403);
        });

        it('админ правит и изменения сохраняются', async () => {
            const title = `Изменённый ${Date.now()}`;

            await http(app)
                .put(`/articles/${articleId}`)
                .set(...bearer(adminToken))
                .send({ ...newArticle(), title })
                .expect(200);

            const { body } = await http(app)
                .get(`/articles/${articleId}`)
                .set(...bearer(userToken))
                .expect(200);

            expect(body.title).toBe(title);
        });

        it('на несуществующую отвечает 404', async () => {
            await http(app)
                .put('/articles/нет-такой')
                .set(...bearer(adminToken))
                .send(newArticle())
                .expect(404);
        });
    });
});
