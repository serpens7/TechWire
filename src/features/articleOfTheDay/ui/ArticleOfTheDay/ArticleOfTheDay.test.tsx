import { screen, waitFor } from '@testing-library/react';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { ArticleOfTheDay } from './ArticleOfTheDay';

const articleOfTheDay = {
    id: '1',
    title: 'Javascript news',
    subtitle: 'Что нового в языке',
    img: 'https://example.com/js.png',
    views: 1022,
    createdAt: '26.02.2022',
    type: ['IT', 'SCIENCE'],
    user: { id: '1', username: 'admin', roles: ['ADMIN'] },
};

/** /highlights отдаёт оба блока одним запросом — второй тут не нужен. */
function stubHighlights(payload: unknown) {
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

describe('features/ArticleOfTheDay', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('показывает заголовок, автора и просмотры', async () => {
        stubHighlights({ articleOfTheDay, snippetOfTheDay: null });

        componentRender(<ArticleOfTheDay />);

        expect(await screen.findByText('Javascript news')).toBeInTheDocument();
        expect(screen.getByText('Что нового в языке')).toBeInTheDocument();
        expect(screen.getByText('admin')).toBeInTheDocument();
        expect(screen.getByText('1022')).toBeInTheDocument();
    });

    test('ведёт на статью и на автора', async () => {
        stubHighlights({ articleOfTheDay, snippetOfTheDay: null });

        componentRender(<ArticleOfTheDay />);

        await screen.findByText('Javascript news');

        const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('/articles/1');
        // Автор кликабелен и ведёт на публичную карточку, а не на authOnly
        // /profile/:id — гость на главной должен туда попадать.
        expect(hrefs).toContain('/users/1');
    });

    test('пока грузится — скелет, а не пустота', () => {
        // Запрос не резолвим: компонент остаётся в isLoading.
        jest.spyOn($api, 'request').mockImplementation(() => new Promise(() => {}));

        const { container } = componentRender(<ArticleOfTheDay />);

        expect(container.querySelectorAll('[class*="Skeleton"]').length).toBeGreaterThan(0);
    });

    test('без данных не рендерит ничего', async () => {
        stubHighlights({ articleOfTheDay: null, snippetOfTheDay: null });

        const { container } = componentRender(<ArticleOfTheDay />);

        // Сначала скелет, после ответа — пусто: главная не должна показывать
        // рамку блока, для которого сервер ничего не вернул.
        await waitFor(() => {
            expect(container.querySelectorAll('[class*="Skeleton"]')).toHaveLength(0);
        });
        expect(container).toBeEmptyDOMElement();
    });
});
