# TechWire — production-style React SPA + NestJS API

A production-style application built on **Feature-Sliced Design (FSD)**: an articles platform with authentication, role-based access, comments, ratings, notifications, i18n, and theming — backed by a **real REST API** (NestJS + Prisma + PostgreSQL) in `server/`.

## Tech stack

### Frontend

| Area | Choice |
| --- | --- |
| UI | React 19.2 (`createRoot`) |
| State | Redux Toolkit 2 + react-redux 9 + redux 5, dynamic (lazy) reducers |
| Server-state | RTK Query on `axiosBaseQuery` (shared axios instance) |
| Router | react-router-dom 6 (typed route builders) |
| i18n | react-i18next 15 / i18next 23 (ru / en) |
| Styling | SCSS Modules + `classNames` helper, light/dark theme |
| UI primitives | @headlessui/react v2 (Dropdown, ListBox, Popover) |
| Virtualization | react-virtuoso (articles list) |
| Build | webpack 5 + **swc-loader**, React Fast Refresh, filesystem cache |
| Language | TypeScript 5 (`moduleResolution: bundler`) |
| Stories | Storybook 8 (webpack5 + SWC) |
| Tests | Jest 29 + @swc/jest + Testing Library 16 (unit/component) |
| E2E | Playwright (real Chromium against the full stack) |
| Architecture linter | steiger (FSD boundaries) |

### Backend (`server/`)

| Area | Choice |
| --- | --- |
| Framework | NestJS 11 on the **Fastify** adapter |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Database | PostgreSQL 17 |
| Auth | JWT (`@nestjs/jwt`) + bcrypt, global guard, role guard |
| Validation | zod |
| Docs | `@nestjs/swagger` → Swagger UI на `/api` + `openapi.json` |
| Tests | Jest + supertest against a real PostgreSQL (133 API tests) |

`server/` is a **separate npm package** with its own `package.json`, `tsconfig` and `node_modules` — Nest needs CommonJS + decorators, which the frontend tsconfig can't provide. See [`server/README.md`](server/README.md).

## Features

- **Feature-Sliced Design** — enforced by `steiger`; strict layer boundaries and public APIs.
- **Real auth** — bcrypt password check, signed JWT, `Authorization: Bearer`. **Reading is public** (articles, a single article, comments, author cards); everything that creates or changes content requires a token, as do personal-data routes.
- **Sign-up** — `POST /register` answers with the same `{ user, token }` shape as `/login`, so a new account is signed in immediately. The profile row is created in the same transaction.
- **Brute-force protection** — login and registration are rate-limited (`@nestjs/throttler`, 5/min per IP by default, env-tunable). Auth failures come back as typed codes, so the UI can say *why* it refused.
- **Role-based access (RBAC)** — `UserRole` (ADMIN / MANAGER / USER). Enforced on the server (`@Roles('ADMIN')` on article create/edit); the frontend `RequireAuth` gate is UX on top of it.
- **RTK Query** — server-state via `injectEndpoints`; a single `axiosBaseQuery` so the auth header lives in one place.
- **Articles** — virtualized list (grid/list views), pagination, sorting, search, type filter; details with code/image/text blocks, recommendations, comments, and **ratings** (star rating + feedback).
- **View counting** — reading an article really increments its counter (the author's own views don't count), and every read is logged to `article_views`. The homepage's "article of the day" picks the most-read article **of the last 7 days**, not of all time — otherwise one article would hold the spot forever.
- **Threaded comments** — one-level replies (Reddit-style flatten: replying to a reply attaches to the same root). Each comment has its own inline reply form, YouTube-style. You can delete your own comments; deleting a root removes its replies with it.
- **Author pages** — a public `/users/:id` with the author's card and their articles; the author's name is clickable everywhere it appears. Distinct from `/profile/:id`, which stays the private edit screen.
- **Profiles** — name, age, city, avatar, currency, country and a short free-form **status**; age, city and status are also shown on the public author card.
- **Notifications** — bell in the navbar, polled via RTK Query; anchored Popover on desktop, swipe-to-dismiss Drawer on mobile.
- **i18n** — Russian / English, all user-facing text via `t()`.
- **Theming** — light / dark, persisted; theme vars on `<body>`.
- **Storybook** — components documented in isolation.

## Getting started

### Prerequisites

- **Node.js 24.x** — CI runs on node 24 and the lockfile was authored by npm 11, so older versions may fail `npm ci`.
- **PostgreSQL 17** running locally.

### Install

```bash
npm ci
npm run server:install
```

### Configure the database

Copy `server/.env.example` to `server/.env` and set your postgres password in `DATABASE_URL`. Then create and seed the database:

```bash
npm --prefix server run db:migrate
```

This creates the `techwire` database, applies migrations, and seeds it from `json-server/db.json` (36 articles, 2 users, comments, ratings, notifications).

### Run (dev)

Make sure PostgreSQL is up. On Windows the service is typically set to `Manual`, so start it from an **administrator** console:

```bash
Start-Service postgresql-x64-17
```

Then:

```bash
npm run start:dev
```

This runs, concurrently:

- the **app** (webpack-dev-server) on **http://localhost:3000**
- the **API** (NestJS) on **http://localhost:8000**

Health check: **http://localhost:8000/health** → `{"status":"ok","db":"up"}`. If it reports `db: down`, PostgreSQL isn't running.

### Demo accounts

| Login   | Password | Role  |
| ------- | -------- | ----- |
| `admin` | `123`    | ADMIN |
| `user2` | `321`    | USER  |

Passwords are stored as bcrypt hashes; these are the seeded credentials. The admin account can create and edit articles; the user account gets a Forbidden page on those routes.

## Scripts

### Frontend (root)

| Command | Description |
| --- | --- |
| `npm run start:dev` | App (`:3000`) + API (`:8000`) together |
| `npm run type:check` | `tsc --noEmit` (excludes `server/`) |
| `npm run lint:ts` / `lint:ts:fix` | ESLint (airbnb) |
| `npm run lint:scss` / `lint:scss:fix` | Stylelint |
| `npm run lint:fsd` | steiger — FSD architecture boundaries |
| `npm run unit` | Jest unit/component tests |
| `npm run e2e` | Playwright end-to-end tests (boots the stack automatically) |
| `npm run e2e:ui` | Playwright interactive UI mode |
| `npm run e2e:report` | Open the last Playwright HTML report |
| `npm run build:prod` | Production webpack build |
| `npm run storybook` / `build-storybook` | Storybook dev / static build |
| `npm run server:install` | `npm ci` inside `server/` |
| `npm run api:types` | Regenerate frontend types from `server/openapi.json` |
| `npm run api:sync` | Rebuild the OpenAPI schema **and** the frontend types |

### Backend (`npm --prefix server run …`)

| Command | Description |
| --- | --- |
| `start:dev` | Nest dev server with watch |
| `build` / `start:prod` | Compile and run (`dist/src/main.js`) |
| `type:check` | `tsc --noEmit` |
| `db:migrate` | Create/migrate the database (`prisma migrate dev`) |
| `db:seed` | Seed from `db.json` — idempotent, safe to re-run |
| `db:seed:fresh` | **Wipe** and re-seed |
| `db:reset` | Drop and recreate the database from scratch |
| `db:verify` | Assert the database matches `db.json` |
| `test:e2e` | 133 API tests against a real database — **wipes and reseeds it** |
| `openapi` | Rebuild `openapi.json` |

## API contract & types

The backend documents itself: **http://localhost:8000/api** (Swagger UI). Response shapes are defined once as zod schemas (`server/src/common/serialization/schemas.ts`) and reused three ways — to type the serializers (so `tsc` catches a serializer that stops matching the documented shape), to build the OpenAPI schema, and to generate the frontend's types.

`server/openapi.json` is committed and drives `src/shared/api/generated/schema.ts`:

```bash
npm run api:sync    # rebuild schema + frontend types
```

Frontend entity types (`Article`, `Profile`, …) are still hand-written — they can't simply be replaced, because values like `ArticleType.IT` are used as values, and `ArticleType` additionally carries `ALL`, a filter value the server never sends. Instead the duplication is **verified**: `src/app/types/apiConformance.ts` asserts at the type level that server data fits the frontend types. Drift stops being silent — it fails `npm run type:check`.

CI additionally checks that regenerating the schema and the types produces no diff, so changing the contract without regenerating is caught too.

## End-to-end tests (Playwright)

Unit/component tests (Jest) run in **jsdom** with a mocked `$api` — great for logic, blind to real routing, navigation, the token surviving a reload, or the RBAC gate. Playwright fills that gap: a **real Chromium** against the **real stack, including the database**.

One-time browser download (Playwright ships its own pinned Chromium):

```bash
npx playwright install chromium
```

Then:

```bash
npm run e2e
```

`playwright.config.ts` boots `npm run start:dev` itself and waits for both `:3000` and `:8000/health` — no need to start anything by hand.

> **Warning:** `globalSetup` **wipes the database and re-seeds it from `db.json`** before every run. Anything you created by hand in the app will be lost. This is what makes the suite repeatable now that writes are real: the rating spec needs an article the user hasn't rated yet.

Coverage — 27 specs across 7 files:

| Spec | What it covers |
| --- | --- |
| `auth.spec.ts` | login, token surviving a reload, RBAC redirect to `/forbidden` |
| `article.spec.ts` | commenting, rating, article creation with validation, deleting your own comment |
| `commentReplies.spec.ts` | the inline reply mini-form, `@author` attribution, cancel |
| `author.spec.ts` | guest clicks an author → public `/users/:id` page |
| `guestMain.spec.ts` | what a signed-out visitor can read and what asks them to sign in |
| `articlesPagination.spec.ts` | infinite scroll, no scroll jump while loading |
| `notFound.spec.ts` | unknown URL renders the 404 page, not a crash |

Writes are **not** stubbed — the assertions check that data actually persisted (a comment survives a reload, a rating permanently flips the card, a deleted comment stays deleted).

**Headed / UI mode & `PW_CHANNEL`.** Headless (`npm run e2e`) uses Playwright's bundled Chromium and always works. If the bundled Chromium can't launch **headed** on your machine (some Windows boxes throw a "side-by-side configuration is incorrect" error — a broken OS runtime, unrelated to this project), fall back to an installed system browser:

```powershell
$env:PW_CHANNEL="chrome"; npx playwright test --ui
```

`PW_CHANNEL` accepts `chrome` or `msedge`. Leave it unset for the bundled Chromium (the CI default).

## Project structure

Frontend layers, top → bottom — each may import only from layers strictly below, via public API:

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
src/                # frontend (FSD)
├── app/            # providers, global styles, store & router config
├── pages/          # route-level pages (lazy-loaded)
├── widgets/        # composite UI blocks
├── features/       # user-facing interactions
├── entities/       # business entities (model + presentational ui)
└── shared/         # ui kit, hooks, api, consts, test utils
server/             # NestJS API — separate package
├── prisma/         # schema, migrations, seed, verify
└── src/            # auth, articles, comments, ratings, notifications, profile, users
config/             # webpack, jest, storybook configs
e2e/                # Playwright specs + globalSetup (DB reseed)
json-server/        # db.json — seed fixture only; json-server itself is gone
public/locales/     # i18n resources (ru, en)
```

## CI

GitHub Actions (`.github/workflows/main.yml`, node 24.x) runs two jobs in parallel on every push / PR to `main` — split so a red cross immediately says *which side* broke.

**`frontend`:**

```
type:check · lint:ts · lint:scss · lint:fsd · unit · api-types-in-sync · build:prod · build-storybook
```

**`backend`** — against a real PostgreSQL 17 service container, not mocks:

```
type:check · lint · build · openapi-in-sync · test:e2e (133 API tests)
```

Both jobs also assert that regenerating the OpenAPI schema and the frontend types produces no diff, so changing the contract without running `npm run api:sync` is caught here.

`main` is protected by a branch ruleset: no direct pushes, no force-push, no deletion, and both checks must pass — work lands through a pull request.

**Playwright is deliberately not in CI** — it boots the whole dev stack and takes about a minute; it stays a local gate. Run it before anything that touches routing, auth or the comment flows: `npm run e2e`.
