import { z } from 'zod';
import { optionalEnum, optionalPositiveInt, optionalString } from '../../common/validation/query';

/**
 * Имена параметров унаследованы от json-server (_limit, _page, _sort, _order,
 * q, _expand). Выглядят непривычно, но сохранены осознанно: так фронт не
 * требует ни единой правки, и существующий набор e2e работает приёмочным
 * тестом подмены бэкенда. Причёсывание API — отдельная задача.
 */
export const findArticlesQuerySchema = z.object({
    _expand: optionalString,
    // Верхняя граница — защита от запроса всей таблицы одним вызовом.
    _limit: optionalPositiveInt.pipe(z.number().max(100).optional()),
    _page: optionalPositiveInt,
    _sort: optionalEnum(['createdAt', 'views', 'title']),
    _order: optionalEnum(['asc', 'desc']),
    q: optionalString,
    // ArticleType.ALL фронт не присылает — это значение означает «без фильтра».
    type: z.preprocess(
        (value) => (value === '' || value === 'ALL' ? undefined : value),
        z.enum(['IT', 'SCIENCE', 'ECONOMICS']).optional(),
    ),
    // Статьи одного автора — для страницы /users/:id.
    userId: optionalString,
});

export type FindArticlesQuery = z.infer<typeof findArticlesQuerySchema>;

export const findArticleParamsSchema = z.object({
    _expand: optionalString,
});

export type FindArticleParams = z.infer<typeof findArticleParamsSchema>;
