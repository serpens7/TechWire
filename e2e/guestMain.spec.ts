import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: что доступно гостю.
 *
 * Модель доступа: читать может любой, а всё, что создаёт или меняет
 * содержимое — комментарий, оценка, создание и редактирование статьи —
 * требует входа. Раньше было наоборот: каталог был закрыт целиком, а гость
 * видел на главной только тизеры.
 *
 * Проверяется обе стороны границы: что гостя пускают читать и что ему при
 * этом не дают писать.
 */

test.describe('гость: чтение открыто', () => {
    test('видит главную с блоками дня', async ({ page }) => {
        await page.goto('/');

        // Кнопка входа в шапке — признак того, что мы действительно гости.
        await expect(page.getByRole('banner').getByRole('button', { name: 'Enter' })).toBeVisible();

        await expect(page.getByText('Article of the day')).toBeVisible();
        await expect(page.getByText('Snippet of the day')).toBeVisible();
    });

    test('открывает статью с главной', async ({ page }) => {
        await page.goto('/');

        await page.getByRole('button', { name: 'Read article' }).click();

        await expect(page).toHaveURL(/\/articles\/\w+$/);
        // Содержимое статьи на месте, а не заглушка с предложением войти.
        await expect(page.getByText('Recomendations')).toBeVisible();
    });

    test('открывает каталог статей', async ({ page }) => {
        await page.goto('/articles');

        // Раньше RequireAuth уводил отсюда на главную.
        await expect(page).toHaveURL(/\/articles$/);
        await expect(page.locator('a[href*="/articles/"]').first()).toBeVisible();
    });

    test('видит ссылку на статьи в боковом меню и переходит по ней', async ({ page }) => {
        await page.goto('/');

        // Пункт показывался только вошедшим, пока маршрут был authOnly:
        // каталог открыли, а ссылку на него оставили спрятанной.
        const sidebar = page.getByTestId('sidebar');
        await expect(sidebar.getByRole('link', { name: 'Articles' })).toBeVisible();

        await sidebar.getByRole('link', { name: 'Articles' }).click();

        await expect(page).toHaveURL(/\/articles$/);
    });

    test('видит чужие комментарии под статьёй', async ({ page }) => {
        await page.goto('/articles/1');

        await expect(page.getByText('Comments')).toBeVisible();
        // В сиде есть 'some comment', 'some comment 2' и 'some comment 3',
        // поэтому нужен точный поиск.
        await expect(page.getByText('some comment', { exact: true })).toBeVisible();
    });
});

test.describe('гость: запись закрыта', () => {
    test('вместо формы комментария видит предложение войти', async ({ page }) => {
        await page.goto('/articles/1');

        await expect(page.getByText('Sign in to leave a comment')).toBeVisible();
        await expect(page.getByLabel('Enter comment text')).toHaveCount(0);
    });

    test('вместо блока оценки видит предложение войти', async ({ page }) => {
        await page.goto('/articles/1');

        await expect(page.getByText('Sign in to rate this article')).toBeVisible();
    });

    test('из предложения войти открывается форма логина', async ({ page }) => {
        await page.goto('/articles/1');

        // На странице теперь три кнопки с подписью Enter — в шапке и в двух
        // подсказках, — поэтому берём по testid. Первая относится к
        // комментариям: блок оценки идёт ниже.
        await page.getByTestId('AuthRequiredNotice.LoginButton').first().click();

        await expect(page.getByRole('dialog').getByLabel('Enter your login')).toBeVisible();
    });

    test('после входа появляется форма комментария', async ({ page }) => {
        await page.goto('/articles/1');
        await login(page, ADMIN);

        await expect(page.getByLabel('Enter comment text')).toBeVisible();
        await expect(page.getByText('Sign in to leave a comment')).toHaveCount(0);
    });

    test('создание статьи по-прежнему закрыто', async ({ page }) => {
        await page.goto('/articles/new');

        // authOnly без входа уводит на главную.
        await expect(page).toHaveURL(/\/$/);
    });
});
