import { rtkApi } from '@/shared/api/rtkApi';
import type { Article } from '../model/types/article';

const DEFAULT_LIMIT = 12;

interface GetArticlesByAuthorArgs {
    userId: string;
    limit?: number;
}

/**
 * Статьи одного автора — для страницы /users/:id. Отдельно от
 * pages/ArticlesPage/model: тот слайс завязан на фильтры и синхронизацию с
 * URL, здесь нужен только простой список с "показать ещё".
 */
const authorArticlesApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        getArticlesByAuthor: build.query<Article[], GetArticlesByAuthorArgs>({
            query: ({ userId, limit = DEFAULT_LIMIT }) => ({
                url: '/articles',
                params: {
                    userId,
                    _expand: 'user',
                    _limit: limit,
                    _sort: 'createdAt',
                    _order: 'desc',
                },
            }),
            providesTags: (result, error, { userId }) => [{ type: 'Articles', id: userId }],
        }),
    }),
});

export const { useGetArticlesByAuthorQuery } = authorArticlesApi;
