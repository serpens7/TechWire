import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { getIsLoginModalOpen } from '@/entities/User';
import { ArticleComments } from './ArticleComments';

/** Делает открытость модалки входа наблюдаемой из теста, не рендеря сам Navbar. */
const LoginModalOpenSentinel = () => {
    const isOpen = useSelector(getIsLoginModalOpen);
    return isOpen ? <div>LOGIN_MODAL_OPEN</div> : null;
};

const rootComment = {
    id: 'root', text: 'root comment', articleId: '1', userId: '2', user: { id: '2', username: 'user2' },
};

describe('features/ArticleComments', () => {
    beforeEach(() => {
        // RTK Query's axiosBaseQuery calls $api.request(); stub it so
        // getArticleComments resolves and addArticleComment echoes the body.
        jest.spyOn($api, 'request').mockImplementation(async (config: AxiosRequestConfig) => {
            if (config.method === 'POST') {
                return {
                    data: { id: 'new', ...config.data },
                    status: 201,
                    statusText: 'Created',
                    headers: {},
                    config: config as never,
                };
            }

            return {
                data: [rootComment],
                status: 200,
                statusText: 'OK',
                headers: {},
                config: config as never,
            };
        });
    });

    // i18nForTests не подключает реальные переводы — t() возвращает сам ключ.
    test('вошедший пользователь отвечает на комментарий — parentId уходит в запрос', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleComments id='1' />, {
            initialState: {
                user: { authData: { id: '1', username: 'admin' }, inited: true },
            },
        });

        await screen.findByText('root comment');
        await user.click(screen.getByText('comments.reply'));

        expect(await screen.findByText('comments.replyingTo')).toBeInTheDocument();

        await user.type(screen.getByLabelText('comments.enterText'), 'my reply');
        await user.click(screen.getByText('comments.send'));

        await waitFor(() => {
            const postCall = ($api.request as jest.Mock).mock.calls.find(
                ([config]: [AxiosRequestConfig]) => config.method === 'POST',
            );
            expect(postCall).toBeDefined();
            expect(postCall[0].data).toMatchObject({
                articleId: '1',
                userId: '1',
                text: 'my reply',
                parentId: 'root',
            });
        });
    });

    test('гость видит кнопку «Ответить», но форму — нет', async () => {
        componentRender(<ArticleComments id='1' />, {
            initialState: { user: { inited: true } },
        });

        await screen.findByText('root comment');

        expect(screen.getByText('comments.reply')).toBeInTheDocument();
        expect(screen.getByText('auth.toComment')).toBeInTheDocument();
        expect(screen.queryByLabelText('comments.enterText')).not.toBeInTheDocument();
    });

    test('клик «Ответить» гостем открывает модалку входа', async () => {
        const user = userEvent.setup();
        componentRender(
            <>
                <ArticleComments id='1' />
                <LoginModalOpenSentinel />
            </>,
            { initialState: { user: { inited: true } } },
        );

        await screen.findByText('root comment');
        expect(screen.queryByText('LOGIN_MODAL_OPEN')).not.toBeInTheDocument();

        await user.click(screen.getByText('comments.reply'));

        expect(await screen.findByText('LOGIN_MODAL_OPEN')).toBeInTheDocument();
    });
});
