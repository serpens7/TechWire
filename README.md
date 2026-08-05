# IT-news — production-style React SPA

A production-style single-page application built on **Feature-Sliced Design (FSD)**: an articles platform with authentication, role-based access, comments, ratings, notifications, i18n, and theming. The backend is a local **json-server** — no real API required.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18.3 (`createRoot`) |
| State | Redux Toolkit 1.9 + react-redux 8, dynamic (lazy) reducers |
| Server-state | RTK Query on `axiosBaseQuery` (shared axios instance) |
| Router | react-router-dom 6 (typed route builders) |
| i18n | react-i18next 15 / i18next 23 (ru / en) |
| Styling | SCSS Modules + `classNames` helper, light/dark theme |
| UI primitives | @headlessui/react v2 (Dropdown, ListBox, Popover) |
| Virtualization | react-virtuoso (articles list) |
| Build | webpack 5 + **swc-loader**, React Fast Refresh, filesystem cache |
| Language | TypeScript 5 (`moduleResolution: bundler`) |
| Stories | Storybook 8 (webpack5 + SWC) |
| Tests | Jest 29 + @swc/jest + Testing Library 14 (unit/component) |
| E2E | Playwright (real Chromium against the dev stack) |
| Architecture linter | steiger (FSD boundaries) |
| Backend (dev) | json-server (`json-server/db.json`) |

## Features

- **Feature-Sliced Design** — enforced by `steiger`; strict layer boundaries and public APIs.
- **Auth** — login via json-server; token persisted in `localStorage`, attached by an axios interceptor.
- **Role-based access (RBAC)** — `UserRole` (ADMIN / MANAGER / USER); route gating via `RequireAuth`, role-mismatch redirects to a Forbidden page. Article create/edit is admin-only.
- **RTK Query** — server-state via `injectEndpoints`; a single `axiosBaseQuery` so the auth header lives in one place.
- **Articles** — virtualized list (grid/list views), details with code/image/text blocks, recommendations, comments, and **ratings** (star rating + feedback).
- **Notifications** — bell in the navbar, polled via RTK Query; anchored Popover on desktop, swipe-to-dismiss Drawer on mobile.
- **i18n** — Russian / English, all user-facing text via `t()`.
- **Theming** — light / dark, persisted; theme vars on `<body>`.
- **Storybook** — components documented in isolation.

## Getting started

Install dependencies, then start the app and the mock API together — no external services or environment variables required.

### Prerequisites

- **Node.js 24.x** — the CI pipeline runs on node 24, and the lockfile was authored by npm 11, so older node versions may fail `npm ci`.
- **npm** (ships with Node).

### Install

```bash
npm ci
```

### Run (dev)

```bash
npm run start:dev
```

This runs, concurrently:

- the **app** (webpack-dev-server) on **http://localhost:3000**
- the **API** (json-server) on **http://localhost:8000**

### Demo accounts

| Login   | Password | Role  |
| ------- | -------- | ----- |
| `admin` | `123`    | ADMIN |
| `user2` | `321`    | USER  |

The admin account can create and edit articles; the user account gets a Forbidden page on those routes.

## Scripts

| Command | Description |
| --- | --- |
| `npm run start:dev` | App (`:3000`) + json-server (`:8000`) together |
| `npm run type:check` | `tsc --noEmit` |
| `npm run lint:ts` / `lint:ts:fix` | ESLint (airbnb) |
| `npm run lint:scss` / `lint:scss:fix` | Stylelint |
| `npm run lint:fsd` | steiger — FSD architecture boundaries |
| `npm run unit` | Jest unit/component tests |
| `npm run e2e` | Playwright end-to-end tests (boots the dev stack automatically) |
| `npm run e2e:ui` | Playwright interactive UI mode |
| `npm run e2e:report` | Open the last Playwright HTML report |
| `npm run build:prod` | Production webpack build |
| `npm run storybook` / `build-storybook` | Storybook dev / static build |

## End-to-end tests (Playwright)

Unit/component tests (Jest) run in **jsdom** with a mocked `$api` — great for logic,
blind to real routing, real navigation, the token surviving a reload, or the RBAC
route gate. Playwright fills that gap: it drives a **real Chromium** against the
**real dev stack**.

One-time browser download (Playwright ships its own pinned Chromium, it does not use
your installed Chrome):

```bash
npx playwright install chromium
```

Then just:

```bash
npm run e2e
```

`playwright.config.ts` starts `npm run start:dev` itself (app on `:3000` + json-server
on `:8000`) and waits for `:3000` before running — no need to start anything by hand.
The current suite (`e2e/auth.spec.ts`) covers the critical auth + RBAC path: admin
login → the admin-only "Create article" link, auth surviving a reload, and a plain
USER being redirected to `/forbidden` on the admin-only route.

**Headed / UI mode & `PW_CHANNEL`.** Headless (`npm run e2e`) uses Playwright's bundled
Chromium and always works. If the bundled Chromium can't launch **headed** on your
machine (some Windows boxes throw a "side-by-side configuration is incorrect" error —
a broken OS runtime, unrelated to this project), fall back to an installed system
browser via `PW_CHANNEL`:

```powershell
# PowerShell — UI mode on the system Chrome
$env:PW_CHANNEL="chrome"; npx playwright test --ui
```

`PW_CHANNEL` accepts `chrome` or `msedge`. Leave it unset for the bundled Chromium
(the CI default).

## Project structure (FSD)

Layers, top → bottom — each may import only from layers strictly below, via public API:

```
app       → providers (store, router, theme, error boundary)
pages     → thin composition shells
widgets   → Navbar, Sidebar, Page
features  → AuthByUserName, editableProfileCard, ArticleComments,
            articleRating, NotificationButton, Theme/Lang switchers …
entities  → Article, Comment, Profile, User, Rating, Notification …
shared    → ui, lib, api, const, config
```

```
src/
├── app/            # providers, global styles, store & router config
├── pages/          # route-level pages (lazy-loaded)
├── widgets/        # composite UI blocks
├── features/       # user-facing interactions
├── entities/       # business entities (model + presentational ui)
└── shared/         # ui kit, hooks, api, consts, test utils
config/             # webpack, jest, storybook configs
json-server/        # db.json + custom /login endpoint
public/locales/     # i18n resources (ru, en)
```

## CI

GitHub Actions (`.github/workflows/main.yml`, node 24.x) runs the full chain on every push / PR:

```
type:check · lint:ts · lint:scss · lint:fsd · unit · build:prod · build-storybook
```
