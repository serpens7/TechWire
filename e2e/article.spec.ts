import { test, expect } from '@playwright/test';
import { ADMIN, login } from './helpers';

/**
 * End-to-end: article-page interactions — commenting and rating.
 *
 * These flows POST to json-server, which persists to the committed `db.json`
 * fixture. To keep the suite repeatable and non-polluting, the WRITE endpoints
 * (`/comments`, `/article-ratings`) are stubbed via `page.route` — the real UI,
 * routing, forms and RTK Query wiring still run; only the network write is faked.
 * Read endpoints (the article, recommendations, the other feature's data) hit the
 * real backend, so the page renders exactly as in production.
 *
 * Uses article id 1 ("Javascript news"), which exists in db.json.
 */

const ARTICLE = '/articles/1';

test.describe('comments', () => {
    test('a logged-in user can post a comment and see it appear', async ({
        page,
    }) => {
        // Stateful stub: GET returns the accumulated list, POST appends. RTK Query
        // invalidates the Comments tag on POST and refetches, so the new comment
        // shows up through the real query hook — without touching db.json.
        const comments: Array<Record<string, unknown>> = [];
        await page.route('**/comments**', async (route) => {
            const request = route.request();
            if (request.method() === 'POST') {
                const body = request.postDataJSON();
                const created = {
                    id: 'e2e-comment-1',
                    articleId: body.articleId,
                    userId: body.userId,
                    text: body.text,
                    user: { id: body.userId, username: ADMIN.username },
                };
                comments.push(created);
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify(created),
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(comments),
                });
            }
        });

        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

        // The comments section is present; the list starts empty.
        await expect(
            page.getByRole('heading', { name: 'Comments' }),
        ).toBeVisible();

        const text = `E2E comment ${Date.now()}`;
        await page.getByLabel('Enter comment text').fill(text);
        await page.getByRole('button', { name: 'Send' }).click();

        // After the mutation the list refetches and the new comment renders.
        await expect(page.getByText(text)).toBeVisible();
    });
});

test.describe('rating', () => {
    test('a logged-in user can rate the article and leave feedback', async ({
        page,
    }) => {
        await page.route('**/article-ratings**', async (route) => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: '{}',
                });
            } else {
                // Not yet rated → the card prompts for a rating.
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: '[]',
                });
            }
        });

        await page.goto('/');
        await login(page, ADMIN);
        await page.goto(ARTICLE);

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

        const rateRequest = page.waitForRequest(
            (r) =>
                r.url().includes('/article-ratings') && r.method() === 'POST',
        );
        await dialog.getByRole('button', { name: 'Send' }).click();

        // The rating request carries the selected stars and feedback.
        const request = await rateRequest;
        expect(request.postDataJSON()).toMatchObject({
            rate: 4,
            feedback: 'Great article',
        });

        // Local state flips the card to a thank-you.
        await expect(
            page.getByText('Thank you for your rating!'),
        ).toBeVisible();
    });
});

test.describe('article creation', () => {
    // Non-admin → /forbidden gating for this same route is covered in auth.spec.ts.
    const NEW_ID = 'e2e-new-article';

    test('an admin can fill the form and land on the new article', async ({
        page,
    }) => {
        // Stub the write (POST /articles) so nothing is persisted to db.json, and
        // stub the subsequent read of the "created" article so ArticleDetailsPage
        // (which the app navigates to on success) has something to render.
        await page.route('**/articles', async (route) => {
            if (route.request().method() === 'POST') {
                const body = route.request().postDataJSON();
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: NEW_ID, ...body }),
                });
            } else {
                await route.continue();
            }
        });

        await page.route(`**/articles/${NEW_ID}**`, async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: NEW_ID,
                    title: 'E2E created article',
                    subtitle: 'Created via Playwright',
                    img: 'https://example.com/e2e.png',
                    type: ['IT'],
                    views: 0,
                    createdAt: '01.01.2026',
                    blocks: [],
                    user: { id: '1', username: ADMIN.username },
                }),
            });
        });

        await page.goto('/');
        await login(page, ADMIN);
        await page.goto('/articles/new');

        await page
            .getByTestId('EditableArticleCard.Title')
            .fill('E2E created article');
        await page
            .getByTestId('EditableArticleCard.Subtitle')
            .fill('Created via Playwright');
        await page
            .getByTestId('EditableArticleCard.Img')
            .fill('https://example.com/e2e.png');
        // ArticleTypeTabs renders each type as plain clickable text, not a button.
        await page.getByText('IT', { exact: true }).click();

        await page.getByTestId('EditableArticleCard.SaveButton').click();

        // On success the form navigates to the created article's details page.
        await expect(page).toHaveURL(new RegExp(`/articles/${NEW_ID}$`));
        await expect(page.getByText('E2E created article')).toBeVisible();
    });

    test('required-field validation blocks submission', async ({ page }) => {
        await page.goto('/');
        await login(page, ADMIN);
        await page.goto('/articles/new');

        // No fields filled in — saving should surface validation errors and not
        // navigate away.
        await page.getByTestId('EditableArticleCard.SaveButton').click();

        await expect(page).toHaveURL(/\/articles\/new$/);
        await expect(
            page.getByTestId('EditableArticleCard.Error.Paragraph'),
        ).toBeVisible();
    });
});
