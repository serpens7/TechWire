import { test, expect } from '@playwright/test';
import { ADMIN, USER, login } from './helpers';

/**
 * End-to-end: authentication + role-based access control.
 *
 * This is the classic "critical path" — the flow that has to work or the product
 * is pointless — and it's exactly what the jsdom unit/component suite CANNOT
 * check: real routing, the lazy login slice registering, the token surviving in
 * localStorage, the axios interceptor attaching it, and `RequireAuth` gating a
 * route by role against the real json-server `/login` response.
 */

test.describe('auth', () => {
    test('admin can log in and sees the "Create article" link', async ({
        page,
    }) => {
        await page.goto('/');

        await login(page, ADMIN);

        // Scoped to the navbar (<header> → role "banner"): the main page now shows
        // the article author's name too, so a page-wide getByText would match twice
        // and trip Playwright's strict mode.
        await expect(page.getByRole('banner').getByText(ADMIN.username)).toBeVisible();
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
        await expect(page.getByRole('banner').getByText(ADMIN.username)).toBeVisible();

        await page.reload();

        // Still logged in after a hard reload — the interceptor re-attaches the
        // persisted token; a unit test with a mocked $api can't prove this.
        await expect(page.getByRole('banner').getByText(ADMIN.username)).toBeVisible();
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
        await expect(page.getByRole('banner').getByText(USER.username)).toBeVisible();

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
