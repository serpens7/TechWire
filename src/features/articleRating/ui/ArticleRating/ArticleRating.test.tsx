import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosRequestConfig } from 'axios';
import { $api } from '@/shared/api/api';
import { componentRender } from '@/shared/lib/tests/componentRender';
import ArticleRating from './ArticleRating';

const AUTHED = {
    initialState: {
        user: { authData: { id: '1', username: 'admin' }, inited: true },
    },
};

/** Заставляет getArticleRating вернуть заданный список оценок. */
function stubApi(existingRating: unknown[] = []) {
    return jest
        .spyOn($api, 'request')
        // POST отдаёт {}, а не undefined: RTK Query ругается на ответ, в
        // котором нет ни data, ни error.
        .mockImplementation(async (config: AxiosRequestConfig) => ({
            data: config.method === 'POST' ? {} : existingRating,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config as never,
        }));
}

// i18nForTests не подключает реальные переводы — t() возвращает сам ключ.
describe('features/ArticleRating', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('гостю показывает предложение войти и не запрашивает оценку', () => {
        stubApi();

        componentRender(<ArticleRating articleId='1' />, {
            initialState: { user: { inited: true } },
        });

        expect(screen.getByText('auth.toRate')).toBeInTheDocument();
        // Оценка привязана к пользователю: без skip запрос ушёл бы с пустым
        // userId и вернулся бы 401.
        expect($api.request).not.toHaveBeenCalled();
    });

    test('вошедшему без оценки предлагает оценить статью', async () => {
        stubApi([]);

        componentRender(<ArticleRating articleId='1' />, AUTHED);

        expect(
            await screen.findByText('article.valueTheArticle'),
        ).toBeInTheDocument();
    });

    test('уже оценённая статья показывает благодарность вместо приглашения', async () => {
        stubApi([{ id: '1', userId: '1', articleId: '1', rate: 4 }]);

        componentRender(<ArticleRating articleId='1' />, AUTHED);

        expect(await screen.findByText('rating.thankYou')).toBeInTheDocument();
        expect(screen.queryByText('article.valueTheArticle')).not.toBeInTheDocument();
    });

    test('клик по звезде открывает форму отзыва и отправляет оценку', async () => {
        const user = userEvent.setup();
        stubApi([]);

        const { container } = componentRender(<ArticleRating articleId='1' />, AUTHED);

        await screen.findByText('article.valueTheArticle');

        // StarRating рисует пять svg без роли и доступного имени — цепляемся
        // за класс CSS-модуля, как это делает и e2e-спек.
        const stars = container.querySelectorAll('[class*="starIcon"]');
        expect(stars).toHaveLength(5);

        await user.click(stars[3]);

        // hasFeedback => клик открывает модалку, а не отправляет сразу.
        expect(
            await screen.findByText('article.leaveYourFeedbackAboutTheArticle'),
        ).toBeInTheDocument();

        await user.click(screen.getByText('rating.send'));

        await waitFor(() => {
            const post = ($api.request as jest.Mock).mock.calls.find(
                ([config]: [AxiosRequestConfig]) => config.method === 'POST',
            );
            expect(post).toBeDefined();
            expect(post[0].data).toMatchObject({
                articleId: '1',
                userId: '1',
                rate: 4,
            });
        });
    });
});
