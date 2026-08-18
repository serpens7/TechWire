import { screen, waitFor } from '@testing-library/react';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { SnippetOfTheDay } from './SnippetOfTheDay';

const snippetOfTheDay = {
    code: 'const answer = 42;',
    article: {
        id: '3',
        title: 'Kotlin news',
        user: { id: '2', username: 'user2', roles: ['USER'] },
    },
};

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

describe('features/SnippetOfTheDay', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('показывает код и статью-источник', async () => {
        stubHighlights({ articleOfTheDay: null, snippetOfTheDay });

        componentRender(<SnippetOfTheDay />);

        expect(await screen.findByText(/const answer = 42/)).toBeInTheDocument();
        expect(screen.getByText('Kotlin news')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
    });

    test('ведёт на статью-источник и на её автора', async () => {
        stubHighlights({ articleOfTheDay: null, snippetOfTheDay });

        componentRender(<SnippetOfTheDay />);

        await screen.findByText('Kotlin news');

        const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
        expect(hrefs).toContain('/articles/3');
        expect(hrefs).toContain('/users/2');
    });

    test('без сниппета не рендерит ничего', async () => {
        stubHighlights({ articleOfTheDay: null, snippetOfTheDay: null });

        const { container } = componentRender(<SnippetOfTheDay />);

        await waitFor(() => {
            expect(container.querySelectorAll('[class*="Skeleton"]')).toHaveLength(0);
        });
        expect(container).toBeEmptyDOMElement();
    });
});
