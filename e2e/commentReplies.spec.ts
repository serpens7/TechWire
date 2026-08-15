import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: ответ на комментарий действительно сохраняется.
 *
 * Как и остальные пишущие сценарии в article.spec.ts, бьёт по реальному
 * бэкенду — globalSetup пересевает БД перед прогоном, так что состояние
 * предсказуемо. Проверяет то, что не проверить юнит-тестами: что ответ
 * переживает перезагрузку страницы, а не только присутствует в кеше RTK Query
 * сразу после отправки.
 */

const ARTICLE = '/articles/1';

test.describe('ответы на комментарии', () => {
    test('ответ отправляется, отображается со ссылкой на адресата и переживает перезагрузку', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

        await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();

        // Отвечаем на первый же комментарий в сиде — все они от admin.
        await page.getByRole('button', { name: 'Reply' }).first().click();
        await expect(page.getByText('Replying to @admin')).toBeVisible();

        const replyText = `E2E reply ${Date.now()}`;

        const posted = page.waitForResponse(
            (r) =>
                r.url().includes('/comments') &&
                r.request().method() === 'POST' &&
                r.status() === 201,
        );

        await page.getByLabel('Enter comment text').fill(replyText);
        await page.getByRole('button', { name: 'Send' }).click();
        const response = await posted;

        const created = await response.json();
        expect(created.parentId).toEqual(expect.any(String));
        expect(created.replyToUserId).toEqual(expect.any(String));

        // Пришёл через настоящий query hook, а не оптимистичное обновление.
        await expect(page.getByText(replyText)).toBeVisible();
        await expect(page.getByText(`@admin ${replyText}`)).toBeVisible();

        // Переживает перезагрузку — доказательство, что это реальная запись
        // в БД, а не только состояние кеша RTK Query после мутации.
        await page.reload();
        await expect(page.getByText(`@admin ${replyText}`)).toBeVisible();
    });
});
