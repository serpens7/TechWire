import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: infinite-scroll pagination on the articles list.
 *
 * Regression guard for the react-virtuoso `endReached` trigger. The list renders
 * a virtualized grid whose `data` must contain ONLY real articles — mixing
 * skeleton placeholders into `data` poisons Virtuoso's endReached high-water-mark
 * and silently stops pagination after the first page. jsdom/unit tests can't catch
 * this (no real layout, no scrolling, no Virtuoso measurement), so it lives here.
 *
 * Reads hit the real json-server (db.json has 36 articles; page size 12), so
 * scrolling to the bottom must fire a `_page=2` fetch.
 */

test.describe('articles pagination', () => {
    test('scrolling to the end loads the next page', async ({ page }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto('/articles');

        // First page rendered — article cards are links to /articles/<id>
        // (the navbar "Articles" link is exactly /articles, so it's excluded).
        const cards = page.locator('a[href*="/articles/"]');
        await expect(cards.first()).toBeVisible();

        // endReached must dispatch the next-page fetch when we reach the bottom.
        const page2Request = page.waitForRequest(
            (r) => r.url().includes('/articles') && r.url().includes('_page=2'),
            { timeout: 20_000 },
        );

        // Scroll the virtualized list down until the bottom is reached. Steps
        // are intentionally sequential (scroll a bit, let Virtuoso react, repeat).
        await page.mouse.move(640, 400);
        /* eslint-disable no-await-in-loop */
        for (let i = 0; i < 15; i += 1) {
            await page.mouse.wheel(0, 4000);
            await page.waitForTimeout(250);
        }
        /* eslint-enable no-await-in-loop */

        const request = await page2Request;
        const response = await request.response();
        expect(response?.ok()).toBeTruthy();
    });
});
