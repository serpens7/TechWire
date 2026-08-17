import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { ArticleView } from '@/entities/Article';
import { ArticleViewSelector } from './ArticleViewSelector';

describe('features/ArticleViewSelector', () => {
    test('рендерит обе кнопки вида', () => {
        componentRender(<ArticleViewSelector view={ArticleView.SMALL} />);

        expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    test('клик по неактивному виду прокидывает его наверх', async () => {
        const user = userEvent.setup();
        const onViewClick = jest.fn();

        componentRender(
            <ArticleViewSelector view={ArticleView.SMALL} onViewClick={onViewClick} />,
        );

        // Порядок кнопок задан viewTypes: сначала SMALL (плитка), затем BIG (список).
        await user.click(screen.getAllByRole('button')[1]);

        expect(onViewClick).toHaveBeenCalledWith(ArticleView.BIG);
    });

    test('подсвечивает активный вид, гася неактивный', () => {
        const { container } = componentRender(
            <ArticleViewSelector view={ArticleView.SMALL} />,
        );

        // notSelected висит ровно на одной иконке — на той, что не выбрана.
        expect(container.querySelectorAll('[class*="notSelected"]')).toHaveLength(1);
    });

    test('без onViewClick клик не роняет компонент', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleViewSelector view={ArticleView.BIG} />);

        await user.click(screen.getAllByRole('button')[0]);

        expect(screen.getAllByRole('button')).toHaveLength(2);
    });
});
