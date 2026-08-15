import { Comment } from '@/entities/Comment';
import { rtkApi } from '@/shared/api/rtkApi';

interface AddCommentArg {
    articleId: string;
    userId: string;
    text: string;
    /** Комментарий, на который отвечают. Сервер схлопывает вложенность сам. */
    parentId?: string;
}

const articleCommentsApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        getArticleComments: build.query<Comment[], string>({
            query: (articleId) => ({
                url: '/comments',
                params: {
                    articleId,
                    _expand: 'user',
                },
            }),
            providesTags: (result, error, articleId) => [
                { type: 'Comments', id: articleId },
            ],
        }),
        addArticleComment: build.mutation<Comment, AddCommentArg>({
            query: (body) => ({
                url: '/comments',
                method: 'POST',
                body,
            }),
            invalidatesTags: (result, error, { articleId }) => [
                { type: 'Comments', id: articleId },
            ],
        }),
    }),
});

export const useGetArticleComments =
    articleCommentsApi.useGetArticleCommentsQuery;
export const useAddArticleComment =
    articleCommentsApi.useAddArticleCommentMutation;
