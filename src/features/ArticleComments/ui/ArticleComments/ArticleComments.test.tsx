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

            if (config.method === 'DELETE') {
                return {
                    data: undefined,
                    status: 204,
                    statusText: 'No Content',
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
    test('вошедший пользователь отвечает через мини-форму под комментарием — parentId уходит в запрос', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleComments id='1' />, {
            initialState: {
                user: { authData: { id: '1', username: 'admin' }, inited: true },
            },
        });

        await screen.findByText('root comment');

        // Верхняя форма для новых комментариев остаётся — мини-форма ответа
        // появляется отдельно, под конкретным комментарием (YouTube-style),
        // а не переиспользует её.
        expect(screen.getAllByText('comments.send')).toHaveLength(1);

        await user.click(screen.getByText('comments.reply'));

        const replyInput = await screen.findByLabelText('comments.replyPlaceholder');
        await user.type(replyInput, 'my reply');

        // Теперь на странице два Send: верхняя форма и мини-форма ответа —
        // последняя появилась только что, под комментарием.
        const sendButtons = screen.getAllByText('comments.send');
        expect(sendButtons).toHaveLength(2);
        await user.click(sendButtons[1]);

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

        // Мини-форма закрывается после отправки.
        expect(screen.queryByLabelText('comments.replyPlaceholder')).not.toBeInTheDocument();
    });

    test('отмена мини-формы ответа скрывает её без отправки', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleComments id='1' />, {
            initialState: {
                user: { authData: { id: '1', username: 'admin' }, inited: true },
            },
        });

        await screen.findByText('root comment');
        await user.click(screen.getByText('comments.reply'));
        await screen.findByLabelText('comments.replyPlaceholder');

        await user.click(screen.getByText('comments.cancelReply'));

        expect(screen.queryByLabelText('comments.replyPlaceholder')).not.toBeInTheDocument();
        expect(
            ($api.request as jest.Mock).mock.calls.some(
                ([config]: [AxiosRequestConfig]) => config.method === 'POST',
            ),
        ).toBe(false);
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

    test('владелец видит «Удалить» и может удалить свой комментарий', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleComments id='1' />, {
            initialState: {
                // rootComment.userId === '2' — тот же id, что у вошедшего.
                user: { authData: { id: '2', username: 'user2' }, inited: true },
            },
        });

        await screen.findByText('root comment');
        await user.click(screen.getByText('comments.delete'));

        await waitFor(() => {
            const deleteCall = ($api.request as jest.Mock).mock.calls.find(
                ([config]: [AxiosRequestConfig]) => config.method === 'DELETE',
            );
            expect(deleteCall).toBeDefined();
            expect(deleteCall[0].url).toBe('/comments/root');
        });
    });

    test('чужой комментарий не показывает «Удалить»', async () => {
        componentRender(<ArticleComments id='1' />, {
            initialState: {
                // rootComment.userId === '2', вошедший — '1'.
                user: { authData: { id: '1', username: 'admin' }, inited: true },
            },
        });

        await screen.findByText('root comment');

        expect(screen.queryByText('comments.delete')).not.toBeInTheDocument();
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
