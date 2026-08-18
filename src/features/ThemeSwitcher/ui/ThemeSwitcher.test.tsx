import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMemo, useState } from 'react';
import {
    LOCAL_STORAGE_THEME_KEY,
    Theme,
    ThemeContext,
} from '@/shared/const/theme';
import { componentRender } from '@/shared/lib/tests/componentRender';
import { ThemeSwitcher } from './ThemeSwitcher';

/**
 * Свой провайдер вместо приложенческого: тот вычисляет стартовую тему на
 * уровне модуля (`const defaultTheme = localStorage.getItem(...)`), поэтому
 * из теста её уже не подменить — значение прочиталось при импорте.
 */
const ThemeHarness = ({ initial }: { initial: Theme }) => {
    const [theme, setTheme] = useState<Theme>(initial);
    const value = useMemo(() => ({ theme, setTheme }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            <ThemeSwitcher />
        </ThemeContext.Provider>
    );
};

describe('features/ThemeSwitcher', () => {
    beforeEach(() => {
        localStorage.clear();
        document.body.className = '';
    });

    test('переключает светлую тему на тёмную и запоминает выбор', async () => {
        const user = userEvent.setup();
        componentRender(<ThemeHarness initial={Theme.LIGHT} />);

        await user.click(screen.getByRole('button'));

        expect(localStorage.getItem(LOCAL_STORAGE_THEME_KEY)).toBe(Theme.DARK);
        // Тема живёт классом на <body> — от него пляшут CSS-переменные.
        expect(document.body.className).toBe(Theme.DARK);
    });

    test('переключает обратно на светлую', async () => {
        const user = userEvent.setup();
        componentRender(<ThemeHarness initial={Theme.DARK} />);

        await user.click(screen.getByRole('button'));

        expect(localStorage.getItem(LOCAL_STORAGE_THEME_KEY)).toBe(Theme.LIGHT);
        expect(document.body.className).toBe(Theme.LIGHT);
    });

    // Какая именно иконка нарисована, юнит-тестом не проверить: все svg в
    // jsdom подменяются одной и той же заглушкой (config/jest/svgMock.js),
    // и светлая с тёмной неразличимы. Это зона e2e.

    test('двойное переключение возвращает исходную тему', async () => {
        const user = userEvent.setup();
        componentRender(<ThemeHarness initial={Theme.LIGHT} />);

        await user.click(screen.getByRole('button'));
        await user.click(screen.getByRole('button'));

        expect(localStorage.getItem(LOCAL_STORAGE_THEME_KEY)).toBe(Theme.LIGHT);
        expect(document.body.className).toBe(Theme.LIGHT);
    });
});
