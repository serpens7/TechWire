import { test, expect, Page } from '@playwright/test';

/**
 * End-to-end: authentication + role-based access control.
 *
 * This is the classic "critical path" — the flow that has to work or the product
 * is pointless — and it's exactly what the jsdom unit/component suite CANNOT
 * check: real routing, the lazy login slice registering, the token surviving in
 * localStorage, the axios interceptor attaching it, and `RequireAuth` gating a
 * route by role against the real json-server `/login` response.
 *
 * Demo accounts come from json-server/db.json:
 *   admin / 123  → ADMIN
 *   user2 / 321  → USER
 */

const ADMIN = { username: 'admin', password: '123' };
const USER = { username: 'user2', password: '321' };

async function login(page: Page, { username, password }: typeof ADMIN) {
    // Navbar "Enter" button opens the login modal (navbar.login).
    await page.getByRole('button', { name: 'Enter' }).click();

    // NOTE: the shared Input renders `placeholder` as a sibling <div>, not as a
    // real placeholder attribute, and gives the <input> no accessible name — so
    // getByPlaceholder / getByLabel can't match. Target by type inside the form.
    const form = page.locator('form');
    await form.locator('input[type="text"]').fill(username);
    await form.locator('input[type="password"]').fill(password);
    await form.getByRole('button', { name: 'Login' }).click();
}

test.describe('auth', () => {
    test('admin can log in and sees the "Create article" link', async ({
        page,
    }) => {
        await page.goto('/');

        await login(page, ADMIN);

        // The username in the navbar dropdown proves auth state landed in the store.
        await expect(page.getByText(ADMIN.username)).toBeVisible();
        // The create-article link is admin-only (isUserAdmin in the Navbar).
        await expect(
            page.getByRole('link', { name: 'Create article' }),
        ).toBeVisible();
    });

    test('auth survives a page reload (token persisted in localStorage)', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await expect(page.getByText(ADMIN.username)).toBeVisible();

        await page.reload();

        // Still logged in after a hard reload — the interceptor re-attaches the
        // persisted token; a unit test with a mocked $api can't prove this.
        await expect(page.getByText(ADMIN.username)).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Enter' }),
        ).toHaveCount(0);
    });
});

test.describe('RBAC route gating', () => {
    test('a non-admin user is redirected to /forbidden on an admin-only route', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, USER);
        await expect(page.getByText(USER.username)).toBeVisible();

        // No create-article link for a plain USER.
        await expect(
            page.getByRole('link', { name: 'Create article' }),
        ).toHaveCount(0);

        // Hitting the admin-only route directly must bounce to Forbidden.
        await page.goto('/articles/new');
        await expect(page).toHaveURL(/\/forbidden$/);
        await expect(page.getByText('Access denied')).toBeVisible();
    });
});
