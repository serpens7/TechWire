import { rtkApi } from '@/shared/api/rtkApi';
import type { Highlights } from '../model/types/highlights';

/**
 * Тизеры для главной — единственные данные о статьях, доступные без входа.
 *
 * Живёт в entities, а не в одной из фич главной, потому что нужен обеим
 * (`articleOfTheDay` и `snippetOfTheDay`), а импортировать друг друга фичам
 * запрещено. Один запрос на оба блока заодно экономит поход в сеть.
 */
const highlightsApi = rtkApi.injectEndpoints({
    endpoints: (build) => ({
        getHighlights: build.query<Highlights, void>({
            query: () => ({ url: '/highlights' }),
            providesTags: ['Articles'],
        }),
    }),
});

export const useHighlights = highlightsApi.useGetHighlightsQuery;
