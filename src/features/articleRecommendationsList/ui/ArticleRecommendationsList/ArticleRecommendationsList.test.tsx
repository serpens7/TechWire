import { screen, waitFor } from '@testing-library/react';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { ArticleRecommendationsList } from './ArticleRecommendationsList';

const article = (id: string, title: string) => ({
    id,
    title,
    subtitle: 'подзаголовок',
    img: 'https://example.com/img.png',
    views: 100,
    createdAt: '01.01.2024',
    type: ['IT'],
    blocks: [],
    user: { id: '1', username: 'admin' },
});

function stubArticles(payload: unknown) {
    return jest
        .spyOn($api, 'request')
        .mockImplementation(async (config: AxiosRequestConfig) => ({
            data: payload,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as never,
        }));
}

// i18nForTests не подключает реальные переводы — t() возвращает сам ключ.
describe('features/ArticleRecommendationsList', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('запрашивает ровно три статьи', async () => {
        stubArticles([]);

        componentRender(<ArticleRecommendationsList />);

        await waitFor(() => expect($api.request).toHaveBeenCalled());

        const [config] = ($api.request as jest.Mock).mock.calls[0];
        expect(config.url).toBe('/articles');
        expect(config.params).toEqual({ _limit: 3 });
    });

    test('показывает заголовок и карточки рекомендаций', async () => {
        stubArticles([article('1', 'Первая'), article('3', 'Вторая')]);

        componentRender(<ArticleRecommendationsList />);

        expect(await screen.findByText('article.recommendations')).toBeInTheDocument();
        expect(screen.getByText('Первая')).toBeInTheDocument();
        expect(screen.getByText('Вторая')).toBeInTheDocument();
    });

    test('открывает рекомендации в новой вкладке', async () => {
        stubArticles([article('1', 'Первая')]);

        componentRender(<ArticleRecommendationsList />);

        await screen.findByText('Первая');

        // target='_blank': читаешь статью — рекомендация не должна уводить
        // с текущей страницы.
        const link = screen.getAllByRole('link')[0];
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('href', '/articles/1');
    });

    test('на ошибке запроса не рендерит ничего', async () => {
        jest.spyOn($api, 'request').mockRejectedValue(
            Object.assign(new Error('boom'), { response: { status: 500 } }),
        );

        const { container } = componentRender(<ArticleRecommendationsList />);

        await waitFor(() => expect($api.request).toHaveBeenCalled());
        expect(container).toBeEmptyDOMElement();
    });
});
