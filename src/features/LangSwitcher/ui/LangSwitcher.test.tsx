import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18nForTests from '@/shared/config/i18n/i18nForTests';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { LangSwitcher } from './LangSwitcher';

/** Смена языка дёргает setState внутри useTranslation — отсюда act(). */
const changeLanguage = async (lng: string) => {
    await act(async () => {
        await i18nForTests.changeLanguage(lng);
    });
};

describe('features/LangSwitcher', () => {
    afterEach(async () => {
        // Язык живёт в общем на весь прогон экземпляре i18n — возвращаем как было,
        // иначе соседние сьюты начнут получать чужую локаль.
        await changeLanguage('ru');
    });

    test('переключает язык с русского на английский', async () => {
        const user = userEvent.setup();
        componentRender(<LangSwitcher />);

        expect(i18nForTests.language).toBe('ru');

        await user.click(screen.getByRole('button'));

        expect(i18nForTests.language).toBe('en');
    });

    test('переключение работает в обе стороны', async () => {
        const user = userEvent.setup();
        await changeLanguage('en');

        componentRender(<LangSwitcher />);
        await user.click(screen.getByRole('button'));

        expect(i18nForTests.language).toBe('ru');
    });
});
