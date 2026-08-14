import { expect, Page } from '@playwright/test';

/**
 * Shared E2E helpers. Demo accounts come from json-server/db.json:
 *   admin / 123  → ADMIN
 *   user2 / 321  → USER
 */

export const ADMIN = { username: 'admin', password: '123' };
export const USER = { username: 'user2', password: '321' };

/**
 * Logs in through the real UI: opens the navbar login modal and submits.
 * Uses semantic selectors — Modal exposes role="dialog", and the shared Input
 * gives its <input> an accessible name via aria-label={placeholder}.
 */
export async function login(page: Page, { username, password }: typeof ADMIN) {
    // Кнопка входа берётся из шапки (<header> → role "banner"): такая же
    // подпись есть у подсказок «войдите, чтобы...» на странице статьи, и
    // поиск по всей странице стал бы неоднозначным.
    await page.getByRole('banner').getByRole('button', { name: 'Enter' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Enter your login').fill(username);
    await dialog.getByLabel('Enter your password').fill(password);

    const response = page.waitForResponse(
        (r) => r.url().includes('/login') && r.request().method() === 'POST',
    );
    await dialog.getByRole('button', { name: 'Login' }).click();
    await response;

    // Ждём именно исчезновения кнопки входа, а не появления имени пользователя.
    //
    // Раньше ждали текст с логином в шапке, и это работало, пока главная для
    // гостя была пустой. Как только она начала показывать тизер статьи, на
    // странице появилось имя её автора — тоже "admin". Ожидание срабатывало
    // мгновенно, ещё до записи токена, и вызывающий код уходил дальше
    // наперегонки с авторизацией: перезагрузка и переходы заставали гостя.
    await expect(page.getByRole('button', { name: 'Enter' })).toHaveCount(0);
}
