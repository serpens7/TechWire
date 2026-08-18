import { test, expect } from '@playwright/test';

/**
 * End-to-end: клик по автору ведёт на его публичную страницу.
 *
 * Раньше из статьи или комментария на автора перейти было нельзя вовсе; там,
 * где ссылка технически была (CommentCard), она вела на authOnly-роут
 * /profile/:id и выкидывала гостя на главную. /users/:id публичен.
 */
test.describe('гость: переход к автору', () => {
    test('со страницы статьи попадает на публичный профиль автора', async ({ page }) => {
        await page.goto('/articles/1');

        const authorLink = page.locator('a[href^="/users/"]').first();
        await expect(authorLink).toBeVisible();
        await authorLink.click();

        await expect(page).toHaveURL(/\/users\/[^/]+$/);
        // AuthorPage — асинхронный чанк: URL меняется раньше, чем React
        // успевает размонтировать старую страницу и смонтировать новую.
        // Плоский getByText('admin') в этом переходном кадре ловит ещё не
        // размонтированные заголовки комментариев со старой страницы и падает
        // на неоднозначности, а не на отсутствии текста — поэтому ищем текст
        // именно внутри карточки автора.
        await expect(
            page.locator('[class*="AuthorCard"]').getByText('admin', { exact: true }),
        ).toBeVisible();
    });

    test('на странице автора видна хотя бы одна его статья', async ({ page }) => {
        await page.goto('/articles/1');

        await page.locator('a[href^="/users/"]').first().click();
        await expect(page).toHaveURL(/\/users\/[^/]+$/);

        await expect(page.locator('a[href*="/articles/"]').first()).toBeVisible();
    });

    test('из комментария тоже можно перейти к автору', async ({ page }) => {
        await page.goto('/articles/1');

        // Первая ссылка на /users/ на странице — автор самой статьи; вторая
        // и далее идут в комментариях (у статьи 1 их четыре в сиде). До
        // фикса CommentCard эта ссылка вела на authOnly /profile/:id.
        const commentAuthorLink = page.locator('a[href^="/users/"]').nth(1);

        await expect(commentAuthorLink).toBeVisible();
        await commentAuthorLink.click();

        await expect(page).toHaveURL(/\/users\/[^/]+$/);
    });
});
