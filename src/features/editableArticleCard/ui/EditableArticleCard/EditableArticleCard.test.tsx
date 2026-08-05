import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { ArticleType } from '@/entities/Article';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { EditableArticleCard } from './EditableArticleCard';

const options = {
    initialState: {
        user: {
            authData: { id: '1', username: 'admin' },
        },
    },
};

const existingArticle = {
    id: '1',
    title: 'Existing title',
    subtitle: 'Existing subtitle',
    img: 'https://example.com/old.png',
    type: [ArticleType.IT],
    userId: '1',
    views: 10,
    createdAt: '01.01.2024',
    blocks: [],
};

describe('features/EditableArticleCard', () => {
    beforeEach(() => {
        // RTK Query's axiosBaseQuery calls $api.request(); stub it so the
        // create/edit mutations resolve, and the edit-mode getArticle query
        // returns a fixed article.
        jest.spyOn($api, 'request').mockImplementation(
            async (config: AxiosRequestConfig) => ({
                data:
                    config.method === 'GET'
                        ? existingArticle
                        : { id: 'created-id', ...(config.data ?? {}) },
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config as never,
            })
        );
    });

    describe('create mode', () => {
        test('shows validation errors when required fields are missing', async () => {
            componentRender(<EditableArticleCard />, options);

            await userEvent.click(
                screen.getByTestId('EditableArticleCard.SaveButton')
            );

            expect(
                screen.getByTestId('EditableArticleCard.Error.Paragraph')
            ).toBeInTheDocument();
            expect($api.request).not.toHaveBeenCalled();
        });

        test('a filled-in form is sent as a POST request', async () => {
            componentRender(<EditableArticleCard />, options);

            await userEvent.type(
                screen.getByTestId('EditableArticleCard.Title'),
                'New title'
            );
            await userEvent.type(
                screen.getByTestId('EditableArticleCard.Subtitle'),
                'New subtitle'
            );
            await userEvent.type(
                screen.getByTestId('EditableArticleCard.Img'),
                'https://example.com/img.png'
            );
            await userEvent.click(screen.getByText('articles.it'));

            await userEvent.click(
                screen.getByTestId('EditableArticleCard.SaveButton')
            );

            const postCall = ($api.request as jest.Mock).mock.calls.find(
                ([config]: [AxiosRequestConfig]) => config.method === 'POST'
            );
            expect(postCall).toBeDefined();
            const [config] = postCall;
            expect(config.data).toMatchObject({
                title: 'New title',
                subtitle: 'New subtitle',
                img: 'https://example.com/img.png',
                type: [ArticleType.IT],
                userId: '1',
            });
        });
    });

    describe('edit mode', () => {
        test('prefills the form with the fetched article', async () => {
            componentRender(<EditableArticleCard id='1' />, options);

            expect(
                await screen.findByTestId('EditableArticleCard.Title')
            ).toHaveValue('Existing title');
            expect(
                screen.getByTestId('EditableArticleCard.Subtitle')
            ).toHaveValue('Existing subtitle');
        });

        test('an edited form is sent as a PUT request', async () => {
            componentRender(<EditableArticleCard id='1' />, options);

            const titleInput = await screen.findByTestId(
                'EditableArticleCard.Title'
            );
            await userEvent.clear(titleInput);
            await userEvent.type(titleInput, 'Updated title');

            await userEvent.click(
                screen.getByTestId('EditableArticleCard.SaveButton')
            );

            const putCall = ($api.request as jest.Mock).mock.calls.find(
                ([config]: [AxiosRequestConfig]) => config.method === 'PUT'
            );
            expect(putCall).toBeDefined();
            const [config] = putCall;
            expect(config.url).toBe('/articles/1');
            expect(config.data).toMatchObject({ title: 'Updated title' });
        });
    });
});
