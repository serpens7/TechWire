import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: главная для незалогиненного посетителя.
 *
 * Раньше страница открывалась, но выглядела пустой: оба её блока ходили в
 * /articles, а бэкенд закрывает каталог без токена — виджеты получали 401 и
 * не рисовали ничего. Теперь они берут данные из публичного /highlights.
 *
 * Второй смысл этих тестов — проверить, что тизер остался тизером: перейти
 * к самой статье без входа нельзя, и предупреждение об этом появляется до
 * перехода, а не после редиректа непонятно куда.
 */

test.describe('главная без входа', () => {
    test('гость видит статью дня и сниппет дня', async ({ page }) => {
        await page.goto('/');

        // Кнопка входа в шапке — признак того, что мы действительно гости.
        await expect(page.getByRole('button', { name: 'Enter' })).toBeVisible();

        await expect(page.getByText('Article of the day')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Read article' })).toBeVisible();
        await expect(page.getByText('Snippet of the day')).toBeVisible();
    });

    test('переход к статье перехватывается предупреждением', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('button', { name: 'Read article' }).click();

        await expect(page.getByText('Sign in required')).toBeVisible();
        // Никакой навигации не произошло — гость остался на главной, а не
        // получил молчаливый редирект, как раньше делал RequireAuth.
        await expect(page).toHaveURL(/\/$/);
    });

    test('из предупреждения открывается форма входа', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: 'Read article' }).click();

        await page
            .getByTestId('AuthRequiredModal.LoginButton')
            .click();

        // Появилась настоящая форма логина, а не просто закрылось окно.
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByLabel('Enter your login')).toBeVisible();
    });

    test('после входа тот же переход срабатывает', async ({ page }) => {
        await page.goto('/');
        await login(page, ADMIN);

        await page.getByRole('button', { name: 'Read article' }).click();

        await expect(page).toHaveURL(/\/articles\/\w+$/);
    });

    test('каталог статей гостю по-прежнему закрыт', async ({ page }) => {
        await page.goto('/articles');

        // RequireAuth уводит с authOnly-маршрута на главную.
        await expect(page).toHaveURL(/\/$/);
    });
});
