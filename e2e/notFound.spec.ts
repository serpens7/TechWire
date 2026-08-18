import { test, expect } from '@playwright/test';

/**
 * Страница 404.
 *
 * Маршрут `*` живёт в общем routeConfig, поэтому ломается незаметно: ни один
 * другой тест на несуществующие адреса не заходит. Проверяем, что показывается
 * именно страница, а не заглушка ErrorBoundary, и что с неё есть выход.
 */
test.describe('страница 404', () => {
    test('несуществующий адрес показывает страницу, а не ошибку', async ({ page }) => {
        await page.goto('/no-such-page');

        await expect(page.getByText('Page not found')).toBeVisible();
        // Заглушка ErrorBoundary рендерится вместо всего приложения — если бы
        // сработала она, шапки на странице не было бы.
        await expect(page.getByRole('banner')).toBeVisible();
        await expect(page.getByText('An unexpected error occured')).toHaveCount(0);
    });

    test('с 404 можно вернуться на главную', async ({ page }) => {
        await page.goto('/no-such-page');

        await page.getByRole('button', { name: 'Go to home' }).click();

        await expect(page).toHaveURL(/\/$/);
        await expect(page.getByText('Article of the day')).toBeVisible();
    });
});
