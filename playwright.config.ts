import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration.
 *
 * `webServer` boots the whole dev stack via `npm run start:dev` — the app
 * (webpack-dev-server on :3000) AND json-server (:8000) together — and waits
 * for the app to answer on :3000 before the suite starts. This is the point of
 * E2E: real browser → real bundle → real backend, no jsdom and no mocked `$api`.
 *
 * `locale: 'en-US'` pins the browser language so react-i18next's LanguageDetector
 * resolves to English, keeping text-based selectors (from public/locales/en)
 * deterministic across machines.
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 30_000,
    expect: { timeout: 10_000 },
    use: {
        baseURL: 'http://localhost:3000',
        locale: 'en-US',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Opt-in escape hatch: on machines where Playwright's bundled
                // Chromium can't launch headed (e.g. a broken Windows side-by-side
                // runtime), set PW_CHANNEL=chrome (or msedge) to use the installed
                // system browser instead. Unset → bundled Chromium (CI default).
                channel: process.env.PW_CHANNEL || undefined,
            },
        },
    ],
    webServer: {
        command: 'npm run start:dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        // json-server adds a 500ms artificial delay per request and the first
        // webpack dev build is slow, so give the stack generous headroom.
        timeout: 180_000,
    },
});
