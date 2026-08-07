import { Article } from '@/entities/Article';
import { rtkApi } from '@/shared/api/rtkApi';

const snippetOfTheDayApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        // json-server can't filter by nested block content, so this fetches a
        // batch of recent articles and the CODE-block selection happens
        // client-side in pickSnippetOfTheDay.
        getSnippetCandidates: build.query<Article[], void>({
            query: () => ({
                url: '/articles',
                params: {
                    _expand: 'user',
                    _sort: 'createdAt',
                    _order: 'desc',
                    _limit: 20,
                },
            }),
            providesTags: ['Articles'],
        }),
    }),
});

export const useSnippetCandidates =
    snippetOfTheDayApi.useGetSnippetCandidatesQuery;
