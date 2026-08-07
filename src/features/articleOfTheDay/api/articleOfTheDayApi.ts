import { Article, ArticleSortField } from '@/entities/Article';
import { rtkApi } from '@/shared/api/rtkApi';

const articleOfTheDayApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        getArticleOfTheDay: build.query<Article, void>({
            query: () => ({
                url: '/articles',
                params: {
                    _expand: 'user',
                    _sort: ArticleSortField.VIEWS,
                    _order: 'desc',
                    _limit: 1,
                },
            }),
            transformResponse: (response: Article[]) => response[0],
            providesTags: ['Articles'],
        }),
    }),
});

export const useArticleOfTheDay = articleOfTheDayApi.useGetArticleOfTheDayQuery;
