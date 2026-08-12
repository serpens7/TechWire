import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Блоки статьи полиморфны: у каждого типа свой набор полей. Дискриминированное
 * объединение проверяет именно ту форму, которая соответствует type, — в БД
 * они лежат JSON-колонкой, и без этой проверки туда попадёт что угодно.
 */
const articleBlockSchema = z.discriminatedUnion('type', [
    z.object({
        id: z.string(),
        type: z.literal('CODE'),
        code: z.string(),
    }),
    z.object({
        id: z.string(),
        type: z.literal('IMAGE'),
        src: z.string(),
        title: z.string(),
    }),
    z.object({
        id: z.string(),
        type: z.literal('TEXT'),
        title: z.string().optional(),
        paragraphs: z.array(z.string()),
    }),
]);

/** Фронт присылает дату в том же виде, в каком получает: "DD.MM.YYYY". */
const ruDate = z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Ожидался формат DD.MM.YYYY');

export const articleBodySchema = z.object({
    title: z.string().min(1, 'Заголовок обязателен'),
    subtitle: z.string().min(1, 'Подзаголовок обязателен'),
    img: z.string().min(1, 'Изображение обязательно'),
    type: z.array(z.enum(['IT', 'SCIENCE', 'ECONOMICS'])).min(1, 'Нужен хотя бы один тип'),
    blocks: z.array(articleBlockSchema).default([]),
    views: z.coerce.number().int().min(0).optional(),
    createdAt: ruDate.optional(),
    // Фронт присылает id и userId (он отправляет обратно тот же объект, что
    // получил на GET). Принимаем, чтобы не отвергать запрос, но НЕ используем:
    // автор берётся из токена, id — из пути.
    id: z.string().optional(),
    userId: z.string().optional(),
});

export type ArticleBody = z.infer<typeof articleBodySchema>;

/** Тот же контракт для Swagger — попадает в openapi.json и в типы фронта. */
export class ArticleBodyDto extends createZodDto(articleBodySchema) {}
