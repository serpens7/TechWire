import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: article-page interactions — commenting, rating, creation.
 *
 * These flows hit the REAL backend and REALLY write to Postgres. Previously the
 * write endpoints were stubbed via `page.route`, because json-server persisted
 * into the committed `db.json` fixture and every run would have dirtied it.
 * That made the assertions weaker than they looked: they proved the frontend
 * SENT the right request, not that anything was stored.
 *
 * With a real database there is nothing to fake — `globalSetup` reseeds from
 * `db.json` before the suite, so each run starts from a known state.
 *
 * Uses article id 1 ("Javascript news"). Note the seeded article ids are NOT
 * contiguous (1, 3, 18…51).
 */

const ARTICLE = '/articles/1';

// Article 1 already carries an admin rating in the seed data (db.json has
// userId=1 rating articles 1, 28 and 29), so the "rate me" card never shows
// there. The old stub hid this by always answering `[]`. Article 34 is unrated
// by admin, which is what this flow needs.
const UNRATED_ARTICLE = '/articles/34';

test.describe('comments', () => {
    test('a logged-in user can post a comment and see it appear', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

        await expect(
            page.getByRole('heading', { name: 'Comments' }),
        ).toBeVisible();

        const text = `E2E comment ${Date.now()}`;

        // Wait for the real POST so the assertion below can't pass on a stale
        // render — RTK Query invalidates the Comments tag and refetches.
        const posted = page.waitForResponse(
            (r) =>
                r.url().includes('/comments') &&
                r.request().method() === 'POST' &&
                r.status() === 201,
        );

        await page.getByLabel('Enter comment text').fill(text);
        await page.getByRole('button', { name: 'Send' }).click();
        await posted;

        // The comment came back from the database, through the real query hook.
        await expect(page.getByText(text)).toBeVisible();

        // And it survives a reload — proof it was actually persisted, which the
        // old stubbed version could not show.
        await page.reload();
        await expect(page.getByText(text)).toBeVisible();
    });
});

test.describe('rating', () => {
    test('a logged-in user can rate the article and leave feedback', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(UNRATED_ARTICLE);

        // Requires a clean state: admin has no rating for this article in the
        // seed, and globalSetup restores that state before every run.
        await expect(page.getByText('Rate the article')).toBeVisible();

        // StarRating renders 5 svg stars with no semantic role/name; the module
        // class name (kept in the dev build the e2e stack runs) is the handle.
        const stars = page.locator('[class*="starIcon"]');
        await expect(stars).toHaveCount(5);

        // Click the 4th star → hasFeedback opens the feedback modal.
        await stars.nth(3).click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await dialog.getByLabel('Your feedback').fill('Great article');

        const rated = page.waitForResponse(
            (r) =>
                r.url().includes('/article-ratings') &&
                r.request().method() === 'POST' &&
                r.ok(),
        );
        await dialog.getByRole('button', { name: 'Send' }).click();
        await rated;

        await expect(
            page.getByText('Thank you for your rating!'),
        ).toBeVisible();

        // Reload: the backend now reports an existing rating, so the card no
        // longer asks for one. This is the assertion the stub made impossible.
        await page.reload();
        await expect(page.getByText('Rate the article')).toHaveCount(0);
    });
});

test.describe('article creation', () => {
    // Non-admin → /forbidden gating for this same route is covered in auth.spec.ts.

    test('an admin can fill the form and land on the new article', async ({
        page,
    }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto('/articles/new');

        const title = `E2E created article ${Date.now()}`;

        await page.getByTestId('EditableArticleCard.Title').fill(title);
        await page
            .getByTestId('EditableArticleCard.Subtitle')
            .fill('Created via Playwright');
        await page
            .getByTestId('EditableArticleCard.Img')
            .fill('https://example.com/e2e.png');
        // ArticleTypeTabs renders each type as plain clickable text, not a button.
        await page.getByText('IT', { exact: true }).click();

        const created = page.waitForResponse(
            (r) =>
                r.url().endsWith('/articles') &&
                r.request().method() === 'POST' &&
                r.status() === 201,
        );
        await page.getByTestId('EditableArticleCard.SaveButton').click();
        await created;

        // The app navigates to the real id the backend generated (a cuid, not a
        // number — seeded ids are numeric, new ones are not).
        await expect(page).toHaveURL(/\/articles\/[a-z0-9]{20,}$/);
        await expect(page.getByText(title)).toBeVisible();
    });

    test('required-field validation blocks submission', async ({ page }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto('/articles/new');

        // No fields filled in — saving should surface validation errors and not
        // navigate away. Client-side validation runs before any request.
        await page.getByTestId('EditableArticleCard.SaveButton').click();

        await expect(page).toHaveURL(/\/articles\/new$/);
        await expect(
            page.getByTestId('EditableArticleCard.Error.Paragraph'),
        ).toBeVisible();
    });
});
