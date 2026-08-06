import { Page } from '@playwright/test';

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
    await page.getByRole('button', { name: 'Enter' }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Enter your login').fill(username);
    await dialog.getByLabel('Enter your password').fill(password);
    await dialog.getByRole('button', { name: 'Login' }).click();

    // Wait until auth actually lands (username shows in the navbar) so callers
    // can navigate to authOnly routes without racing the /login response.
    await page.getByText(username, { exact: true }).first().waitFor();
}
