import { TestAsyncThunk } from '@/shared/lib/tests/TestAsyncThunk';
import { fetchArticlesList } from './fetchArticlesList';
import { fetchNextArticlesPage } from './fetchNextArticlesPage';

// Фабрика, а не автомок: автомок сначала загружает настоящий модуль, чтобы
// снять с него форму, и тянет за собой всю цепочку до axios — включая
// shared/api/api.ts, который на импорте вешает перехватчики.
jest.mock('./fetchArticlesList', () => ({
    fetchArticlesList: jest.fn(),
}));

describe('fetchNextArticlesPage.test', () => {
    test('success', async () => {
        const thunk = new TestAsyncThunk(fetchNextArticlesPage, {
            articlesPage: {
                page: 2,
                ids: [],
                entities: {},
                limit: 5,
                isLoading: false,
                hasMore: true,
            },
        });

        await thunk.callThunk();

        expect(thunk.dispatch).toBeCalledTimes(4);
        expect(fetchArticlesList).toHaveBeenCalledWith({});
    });
    test('fetchAritcleList not called', async () => {
        const thunk = new TestAsyncThunk(fetchNextArticlesPage, {
            articlesPage: {
                page: 2,
                ids: [],
                entities: {},
                limit: 5,
                isLoading: false,
                hasMore: false,
            },
        });

        await thunk.callThunk();

        expect(thunk.dispatch).toBeCalledTimes(2);
        expect(fetchArticlesList).not.toHaveBeenCalled();
    });
});
