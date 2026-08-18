import { rtkApi } from '@/shared/api/rtkApi';
import { Author } from '../model/types/author';

const authorApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        getAuthor: build.query<Author, string>({
            query: (id) => ({ url: `/users/${id}` }),
            providesTags: (result, error, id) => [{ type: 'Users', id }],
        }),
    }),
});

export const { useGetAuthorQuery } = authorApi;
