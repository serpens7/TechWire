import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './axiosBaseQuery';

export const rtkApi = createApi({
    reducerPath: 'api',
    tagTypes: ['Comments', 'Profile', 'Articles', 'Users'],
    baseQuery: axiosBaseQuery(),
    endpoints: () => ({}),
});
