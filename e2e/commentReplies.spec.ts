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
 *
 * Ответ отправляется через отдельную мини-форму под конкретным комментарием
 * (в духе YouTube) — не через общую форму нового комментария вверху блока,
 * поэтому на странице в момент отправки два поля "Enter comment text"-подобных
 * инпута и две кнопки Send: различаем их по тому, что у мини-формы свой
 * placeholder "Reply to @username".
 */

const ARTICLE = '/articles/1';

test.describe('ответы на комментарии', () => {
    test('ответ отправляется через мини-форму, отображается со ссылкой на адресата и переживает перезагрузку', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

        await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();

        // Отвечаем на первый же комментарий в сиде — все они от admin.
        await page.getByRole('button', { name: 'Reply' }).first().click();

        const replyInput = page.getByLabel('Reply to @admin');
        await expect(replyInput).toBeVisible();

        const replyText = `E2E reply ${Date.now()}`;

        const posted = page.waitForResponse(
            (r) =>
                r.url().includes('/comments') &&
                r.request().method() === 'POST' &&
                r.status() === 201,
        );

        await replyInput.fill(replyText);
        // Две формы на странице — общая для новых комментариев и мини-форма
        // ответа — значит, и Send теперь два; мини-форма смонтировалась
        // последней, поэтому её кнопка последняя в DOM-порядке.
        await page.getByRole('button', { name: 'Send' }).last().click();
        const response = await posted;

        const created = await response.json();
        expect(created.parentId).toEqual(expect.any(String));
        expect(created.replyToUserId).toEqual(expect.any(String));

        // Мини-форма закрылась после отправки.
        await expect(page.getByLabel('Reply to @admin')).toHaveCount(0);

        // Пришёл через настоящий query hook, а не оптимистичное обновление.
        await expect(page.getByText(replyText)).toBeVisible();
        await expect(page.getByText(`@admin ${replyText}`)).toBeVisible();

        // Переживает перезагрузку — доказательство, что это реальная запись
        // в БД, а не только состояние кеша RTK Query после мутации.
        await page.reload();
        await expect(page.getByText(`@admin ${replyText}`)).toBeVisible();
    });

    test('отмена мини-формы ответа закрывает её без отправки', async ({ page }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

        await page.getByRole('button', { name: 'Reply' }).first().click();
        await expect(page.getByLabel('Reply to @admin')).toBeVisible();

        await page.getByRole('button', { name: 'Cancel' }).click();

        await expect(page.getByLabel('Reply to @admin')).toHaveCount(0);
    });
});
