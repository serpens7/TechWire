import { rtkApi } from '@/shared/api/rtkApi';
import { ArticleFormData } from '../model/types/editableArticleCardSchema';

const articleApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        // No `_expand=user` here on purpose: the raw record (with `userId`) is what
        // we send straight back on PUT — see ArticleFormData.
        getArticle: build.query<ArticleFormData, string>({
            query: (articleId) => ({
                url: `/articles/${articleId}`,
            }),
            providesTags: (result, error, articleId) => [
                { type: 'Articles', id: articleId },
            ],
        }),
        createArticle: build.mutation<ArticleFormData, ArticleFormData>({
            query: (data) => ({
                url: '/articles',
                method: 'POST',
                body: data,
            }),
        }),
        updateArticle: build.mutation<ArticleFormData, ArticleFormData>({
            query: (data) => ({
                url: `/articles/${data.id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Articles', id },
            ],
        }),
    }),
});

export const {
    useGetArticleQuery,
    useCreateArticleMutation,
    useUpdateArticleMutation,
} = articleApi;
