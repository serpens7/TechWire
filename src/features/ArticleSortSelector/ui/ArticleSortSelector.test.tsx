import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { ArticleSortField } from '@/entities/Article';
import { ArticleSortSelector } from './ArticleSortSelector';

// i18nForTests не подключает реальные переводы — t() возвращает сам ключ.
const props = {
    sort: ArticleSortField.CREATED,
    order: 'asc' as const,
    onChangeSort: jest.fn(),
    onChangeOrder: jest.fn(),
};

describe('features/ArticleSortSelector', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('показывает текущие значения сортировки и порядка', () => {
        componentRender(<ArticleSortSelector {...props} />);

        const [sortSelect, orderSelect] = screen.getAllByRole('combobox');
        expect(sortSelect).toHaveValue(ArticleSortField.CREATED);
        expect(orderSelect).toHaveValue('asc');
    });

    test('смена поля сортировки прокидывается наверх', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleSortSelector {...props} />);

        const [sortSelect] = screen.getAllByRole('combobox');
        await user.selectOptions(sortSelect, ArticleSortField.VIEWS);

        expect(props.onChangeSort).toHaveBeenCalledWith(ArticleSortField.VIEWS);
        expect(props.onChangeOrder).not.toHaveBeenCalled();
    });

    test('смена порядка прокидывается наверх', async () => {
        const user = userEvent.setup();
        componentRender(<ArticleSortSelector {...props} />);

        const [, orderSelect] = screen.getAllByRole('combobox');
        await user.selectOptions(orderSelect, 'desc');

        expect(props.onChangeOrder).toHaveBeenCalledWith('desc');
        expect(props.onChangeSort).not.toHaveBeenCalled();
    });

    test('предлагает все три поля сортировки', () => {
        componentRender(<ArticleSortSelector {...props} />);

        const [sortSelect] = screen.getAllByRole('combobox');
        const values = [...sortSelect.querySelectorAll('option')].map((o) => o.value);

        expect(values).toEqual([
            ArticleSortField.CREATED,
            ArticleSortField.TITLE,
            ArticleSortField.VIEWS,
        ]);
    });
});
