import { TestAsyncThunk } from '@/shared/lib/tests/TestAsyncThunk';
import { fetchArticlesList } from './fetchArticlesList';
import { initArticlesPage } from './initArticlesPage';

// Фабрика, а не автомок: автомок сначала загружает настоящий модуль, чтобы
// снять с него форму, и тянет за собой всю цепочку до axios — включая
// shared/api/api.ts, который на импорте вешает перехватчики.
jest.mock('./fetchArticlesList', () => ({
    fetchArticlesList: jest.fn(),
}));

describe('initArticlesPage.test', () => {
    test('success', async () => {
        const thunk = new TestAsyncThunk(initArticlesPage, {
            articlesPage: {
                page: 1,
                ids: [],
                entities: {},
                limit: 5,
                isLoading: false,
                hasMore: true,
                inited: false,
            },
        });

        await thunk.callThunk(new URLSearchParams());

        expect(thunk.dispatch).toBeCalledTimes(4);
        expect(fetchArticlesList).toHaveBeenCalledWith({});
    });

    test('initialized', async () => {
        const thunk = new TestAsyncThunk(initArticlesPage, {
            articlesPage: {
                page: 1,
                ids: [],
                entities: {},
                limit: 5,
                isLoading: false,
                hasMore: true,
                inited: true,
            },
        });

        await thunk.callThunk(new URLSearchParams());

        expect(thunk.dispatch).toBeCalledTimes(2);
        expect(fetchArticlesList).not.toHaveBeenCalled();
    });
});
