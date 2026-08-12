# CLAUDE.md

Guidance for working in this repo. Read this first, then dive into code.

## What this is

A production-style React SPA (based on the Ulbi TV "production project") built with
**Feature-Sliced Design (FSD)**. Absolute imports use the `@/` alias → `src/`
(webpack + tsconfig `paths`).

**Backend is a real app in `server/`** — NestJS 11 (Fastify) + Prisma 7 + PostgreSQL 17,
replacing the original json-server. It's a **separate npm package** with its own
`package.json` / `tsconfig` / `node_modules`: Nest needs CommonJS + decorators +
`emitDecoratorMetadata`, which the frontend tsconfig (`jsx`, `moduleResolution: bundler`)
can't provide. Consequently the root `tsconfig.json` and `.eslintignore` **exclude
`server/`** — it has its own `type:check` and `lint`. See `server/README.md`.
`json-server/db.json` survives only as the **seed fixture** (`server/prisma/seed.ts`).

**Response shapes are defined once**, as zod schemas in
`server/src/common/serialization/schemas.ts`. They type the serializers (a serializer
that stops matching its documented shape fails `tsc`), build the OpenAPI document
(Swagger UI on `:8000/api`), and generate the frontend's types. Frontend entity types
stay hand-written — `ArticleType.IT` etc. are used as *values*, and `ArticleType` also
carries `ALL`, which the server never sends — so the duplication is **verified rather
than removed**: `src/app/types/apiConformance.ts` asserts that server data fits the
frontend types, and drift fails `type:check`. That file lives in `app`, not next to the
schema in `shared`, because `shared → entities` is a forbidden FSD import.

## Tech stack (current, verified)

| Area | Choice |
|---|---|
| UI | React **18.3** (`createRoot` in `src/index.tsx`) |
| State | Redux Toolkit **1.9.7** (NOT v2) + react-redux **8.1.3** (redux 4) |
| Server-state | **RTK Query** (`shared/api/rtkApi.ts`) — the modern path; coexists with thunks |
| Router | react-router-dom **6.2** |
| i18n | react-i18next **15** / i18next **23** |
| TS | `typescript@^5.4` (resolves to 5.9); `moduleResolution: "bundler"` |
| Build | webpack **5** (config in `config/build`); **swc-loader** transpiles (not ts-loader), dev filesystem cache + React Fast Refresh, prod `splitChunks` vendor chunk |
| Stories | Storybook **8.6** (webpack5 + SWC compiler) |
| Tests | jest **29** + `@swc/jest` + testing-library **14** (unit/component, jsdom) |
| E2E | **Playwright** — real Chromium against the dev stack (`e2e/`, `playwright.config.ts`) |
| HTTP | **axios `$api`** (`shared/api/api.ts`) for both thunks and RTK Query — `rtkApi.ts` uses `axiosBaseQuery` (`shared/api/axiosBaseQuery.ts`), not `fetchBaseQuery`, so the auth interceptor lives in one place |
| Virtualization | react-virtuoso (articles list; already inside a lazy page chunk) |
| Responsive | **react-device-detect** (`BrowserView`/`MobileView`) — e.g. Popover vs Drawer |
| UI primitives | **@headlessui/react v2** (Dropdown, ListBox, Popover) |
| FSD linter | **steiger** (`lint:fsd`) |

## Commands (npm)

- `npm run type:check` — `tsc --noEmit`
- `npm run lint:ts` / `lint:ts:fix` — eslint (airbnb)
- `npm run lint:scss` / `lint:scss:fix` — stylelint
- `npm run lint:fsd` — steiger (FSD boundaries)
- `npm run unit` — jest (unit/component, jsdom)
- `npm run e2e` — Playwright E2E (boots `start:dev` itself; needs `npx playwright install chromium` once)
- `npm run e2e:ui` / `e2e:headed` — Playwright UI / headed mode; both bake in
  `cross-env PW_CHANNEL=chrome` (system Chrome) because bundled Chromium can't launch
  headed on this Windows box — see gotcha below
- `npm run e2e:report` — open last HTML report
- `npm run build:prod` — production webpack build
- `npm run storybook` / `build-storybook`
- `npm run start:dev` — dev server (`:3000`) + backend (`:8000`), via concurrently.
  Postgres must be running first: `Start-Service postgresql-x64-17` (admin console;
  the service is set to `Manual`).
- Backend-side: `npm --prefix server run db:migrate` / `db:seed` / `db:seed:fresh`
  (wipe + reseed) / `db:verify` (check DB against `db.json`) / `type:check` /
  `lint:check` / `test:e2e` (84 API tests — **wipes and reseeds the DB**) / `openapi`
- `npm run api:sync` — rebuild `server/openapi.json` **and** the frontend types in
  `src/shared/api/generated/schema.ts`. Run it after any change to a response shape;
  CI fails if either is stale.

**Before finishing any change, run the CI chain and keep it green** (this is exactly
what `.github/workflows/main.yml` runs, on **node 24.x**):
```
type:check · lint:ts · lint:scss · lint:fsd · unit · build:prod · build-storybook
```

## FSD architecture

Layers, top→bottom (each may import only from layers strictly below, via public API):
```
app → pages → widgets → features → entities → shared
```

Current slices:
- **entities**: Article, Comment, Counter, Country, Currency, Notification, Profile, User
- **features**: ArticleComments, articleRating, AuthByUserName, articleRecommendationsList, editableArticleCard, editableProfileCard, LangSwitcher, NotificationButton, ThemeSwitcher
- **widgets**: Navbar, Page, PageError, PageLoader, Sidebar
- **pages**: About, ArticleDetails, ArticleEdit, Articles, Forbidden, Main, NotFound, Profile
- **shared/ui**: AppLink, Avatar, Button, Card, Code, Drawer, Dropdown, Icon, Input, ListBox, Loader, Modal, PageLoader, Popover, Portal, Select, Skeleton, Stack (HStack/VStack), Tabs, Text
- **app/providers**: ErrorBoundary, StoreProvider, ThemeProvider, router

### Rules the codebase follows (enforced by steiger)
1. **Public API via `index.ts`** — cross-slice imports go to the slice root
   (`@/entities/Article`), never deep (`@/entities/Article/model/...`).
   **Exception:** `shared/ui`/`shared/lib` have NO per-segment public API — deep
   imports like `@/shared/ui/Button/Button` are the convention.
2. **Same-slice imports are relative** (`../../model/...`), never via own `@/`-barrel.
3. **Entity→entity cross-imports use the `@x` notation.** A provider exposes a
   dedicated API for a consumer: `entities/Country/@x/Profile.ts`, imported as
   `@/entities/Country/@x/Profile`. Existing: `User/@x/Article`, `User/@x/Comment`,
   `Country/@x/Profile`, `Currency/@x/Profile`. (`@x` is just a folder name.)
4. **Feature→feature cross-imports have no escape hatch (unlike entities' `@x`) —
   steiger errors, not warns.** If two features need the same UI (e.g. a type
   selector used by both the articles-list filters and the article-editing form),
   it belongs one layer down, in the entity: `ArticleTypeTabs` lives in
   `entities/Article/ui/ArticleTypeTabs`, not in a `features/` slice, so both
   `pages/ArticlesPage` and `features/editableArticleCard` can import it from
   `@/entities/Article` without a forbidden cross-feature edge.

## Redux store (important, non-obvious)

- Store is built with a **reducer manager** for lazy/async reducers
  (`app/providers/StoreProvider/config/reducerManager.ts`). Slices are registered
  at mount via **`DynamicModuleLoader`** (`shared/lib/components/DynamicModuleLoader`)
  with a `ReducersList`, then removed on unmount.
- **`StateSchema` / `ThunkConfig` live in `app`** (`StoreProvider/config/StateSchema.ts`)
  and are imported "upward" by selectors/thunks in entities/features/pages. This is a
  **known, accepted compromise** (the aggregate schema can't sit in shared without
  pointing back at slices). steiger surfaces these as **warnings, not errors** — see
  `steiger.config.ts`. Removing it fully would need Redux module augmentation.
- Typed dispatch: **`useAppDispatch`** (`shared/lib/hooks/useAppDispatch`) for thunks;
  plain `useDispatch` only for plain actions. It stays FSD-clean by typing through
  `AppDispatch` in `shared/types/store.ts` (a generic, store-agnostic type) instead of
  importing the concrete store from `app`.
- **`shared/lib/store/buildSelector.ts`** follows the same pattern: it's generic over
  `TState` (no hardcoded `StateSchema`, no `shared → app` import) — callers annotate the
  concrete type at the call site, e.g. `entities/Counter/model/selectors/getCounterValue.ts`
  does `buildSelector((state: StateSchema) => ...)`. That call site is under `model/**`,
  already covered by the steiger warn-override below; `shared/lib/store/**` itself needs
  no override because it no longer references `app` at all.

## RTK Query (server-state — preferred direction)

- Base API: `shared/api/rtkApi.ts` (`createApi` + `axiosBaseQuery()`,
  `tagTypes: ['Comments', 'Profile', 'Articles']`). Wired into the store (`api` reducer +
  middleware) and `StateSchema[rtkApi.reducerPath]`. `axiosBaseQuery`
  (`shared/api/axiosBaseQuery.ts`) delegates to `$api.request(...)` (call `.request`
  explicitly, not `$api(...)` — the callable instance is a separate bound function from
  `.request`, so tests spying on `$api.request` wouldn't see calls made through the bare
  callable).
- Endpoints are injected (`injectEndpoints`) in an `api/` segment — usually in the feature
  (`features/ArticleComments/api/articleCommentsApi.ts`,
  `features/editableProfileCard/api/profileApi.ts`,
  `features/editableArticleCard/api/articleApi.ts`), or in the entity when the query just
  fetches that entity's own data (`entities/Notification/api/notificationApi.ts`).
  Hooks are re-exported under renamed constants; `tagTypes` stay centralized in `rtkApi`.
- **Two data-fetching paradigms coexist**: legacy `createAsyncThunk`+slice+entityAdapter
  (**Articles listing/details, Auth**) and RTK Query (Comments, Recommendations,
  **Profile**, Notifications, **article create/edit**). Direction of travel = migrate
  server-state to RTK Query. **Profile is already migrated**: `editableProfileCard`
  fetches/updates via `profileApi` (RTK Query); its slice now holds only client-side edit
  state (readonly, form draft, validate errors). **Article create/edit is RTK Query too**
  (`editableArticleCard/api/articleApi.ts` — `getArticle`/`createArticle`/`updateArticle`),
  even though reading the articles list/details page still goes through the legacy thunk
  (`fetchArticlesList`, `fetchArticleById`) — the two paradigms coexist **within the same
  entity**, not just across entities. `getArticle` intentionally fetches without
  `_expand=user` (unlike the read-side thunks) so the same raw record (with `userId`, not
  an expanded `user` object) can be sent straight back on `PUT` — see
  `ArticleFormData` in `editableArticleCard/model/types`. When adding new fetching, prefer
  RTK Query.
- Auth header is set once, by `$api`'s request interceptor (`shared/api/api.ts`) — both
  thunks and RTK Query endpoints go through it. No separate `prepareHeaders` to keep in sync.

## Access control (roles)

- **`UserRole`** enum lives in `shared/const/rbac.ts` and is re-exported from
  `entities/User` (kept in `shared` so `shared/const/router` can reference it without a
  forbidden `shared → entities` import). `User.roles?: UserRole[]` comes from the
  `/login` response (`{ user, token }`); roles also travel **inside the JWT**, which is
  what the backend's `RolesGuard` actually checks.
- **The main page is public.** `GET /highlights` is the one `@Public()` article route:
  it returns the article-of-the-day **without `blocks`** plus the snippet of the day, so
  a guest sees teasers but cannot read anything. Clicking through to an article opens
  `AuthRequiredModal` (`shared/ui`) instead of navigating — driven by `useAuthGate`
  (`entities/User`), which lives there because both main-page features need it and
  feature→feature imports are forbidden. The login modal's open state moved from
  Navbar's local state into `userSlice` for the same reason.
  Watch out in E2E: the main page now renders the article **author's** name, so a
  page-wide `getByText('admin')` matches twice — scope to `getByRole('banner')`.
- **Auth is real JWT.** `/login` verifies the password with bcrypt and signs a token
  (`shared/api/api.ts` sends `Authorization: Bearer <token>`; on 401 it clears storage).
  `localStorage` holds the token (`TOKEN_LOCALSTORAGE_KEY`) plus a **cosmetic** cached
  user for instant paint — `initAuthData` requires both. Nothing is trusted client-side:
  the backend closes every route by default (global `JwtAuthGuard`; `@Public()` opts out
  — only `/login` and `/health`). `RequireAuth` on the frontend is UX only.
- **Route gating**: `AppRouteProps` has an optional `roles?: UserRole[]`; `RequireAuth`
  (`app/providers/router/ui/RequireAuth`) checks auth **and** role intersection — a
  role mismatch redirects to **`ForbiddenPage`** (`/forbidden`), missing auth redirects to
  main. `AppRouter` passes `route.roles` through.
- **What's gated**: article create/edit routes require `UserRole.ADMIN`. The Navbar hides
  the "create article" link via `isUserAdmin`, and `getCanEditArticle`
  (`pages/ArticleDetailsPage/model/selectors/article.ts`) checks the admin role.
- Role selectors: `getUserRoles`, `isUserAdmin`, `isUserManager` (`entities/User`).

## Conventions

- **Styling**: CSS Modules `*.module.scss` + `classNames(cls.Root, mods, [extra])`
  helper. Theme vars under `.app_light_theme` / `.app_dark_theme` (on `<body>` via
  `useTheme`). Theme enum lives in `shared/const/theme`, `useTheme` in `shared/lib/hooks`.
- **Routing**: `shared/const/router` exports `AppRoutes` (enum, used as `routeConfig`
  keys / role-gating) and `getRoute*()` builder functions (`getRouteArticleDetails(id)`,
  `getRouteProfile(id)`, etc.) — no `RoutePath` string-concat record. The same builders
  produce both real links (`getRouteProfile(user.id)`) and route patterns
  (`getRouteProfile(':id')` in `routeConfig`). The route→page map (`routeConfig`) is in
  `app/providers/router/routeConfig`.
- **i18n**: all user-facing text via `t()`. `i18next/no-literal-string` is OFF for
  `*.test.*` and `*.stories.*`.
- **Stories**: SB8, CSF2 template pattern; types `Meta` / `StoryFn` from
  `@storybook/react` (NOT the removed `ComponentMeta`/`ComponentStory`).

## Gotchas learned the hard way

- **CI runs on node 24.x** (set in `main.yml`). The lock was authored by npm 11; node
  22 could fail `npm ci`. Keep node 24 to match.
- **`moduleResolution: "bundler"`** is required — react-i18next 15 ships ESM (`.d.mts`)
  types that `node10` can't resolve; the IDE (TS server) will flag them otherwise.
- **RTK Query component tests mock `$api.request`**, not `fetch` — `rtkApi` runs on
  `axiosBaseQuery`, which calls `$api.request(...)`. `jest.spyOn($api, 'request')
  .mockImplementation(...)` and resolve an axios-shaped response (`{ data, status,
  statusText, headers, config }`); see `EditableProfileCard.test.tsx` /
  `NotificationButton.test.tsx`. Because `axiosBaseQuery` fires the query async
  (on mount / on interaction), assertions on call count often need `waitFor(...)`.
- **`componentRender`** (`shared/lib/tests`) accepts `asyncReducers` — pass it when the
  component under test registers a lazy slice via `DynamicModuleLoader`.
- **`Modal` and `Drawer` share `useModal`** (`shared/lib/hooks/useModal`): open/close
  state, animation timer, Escape handling. `Drawer` adds a pointer-based swipe-to-dismiss
  on its grab handle (no animation libs — plain CSS `transform` + Pointer Events).
- **jsdom has no `PointerEvent`.** `fireEvent.pointer*` silently falls back to a plain
  `Event` and drops `clientY`/`clientX`. Tests exercising pointer drag (see
  `Drawer.test.tsx`) alias `window.PointerEvent = MouseEvent` and stub
  `Element.prototype.setPointerCapture` before rendering.
- **`Popover` exposes `onOpenChange`** via an internal render-prop watcher (headlessui's
  `open` state is only available inside `<HeadlessPopover>`'s children-as-function scope).
  `NotificationButton` uses it to only set `pollingInterval` while the panel is actually
  open/visible (Popover or Drawer), instead of polling forever once mounted.
- **Storybook theme portals**: `@headlessui` `anchor` menus render in a `<body>` portal;
  in Storybook `ThemeDecorator` puts the theme class on a `<div>`, so dropdown menus
  render un-themed in SB (fine in the real app, where the class is on `<body>`).
- **Windows + `core.autocrlf=true`**: editing via shell tools can produce LF/CRLF diff
  noise; huge diffs are usually `package-lock.json`, not real churn.
- **Do NOT `rm package-lock.json && npm install`** — it drifts transitive tool versions
  (stylelint/eslint) and changes lint behavior. Use `npm ci` for clean reinstalls, and
  targeted `npm install pkg@ver` for version changes.
- **Playwright E2E selectors / a11y:** the shared `Input` (`shared/ui/Input`) still
  renders its `placeholder` prop as a sibling `<div>` (`${placeholder}>`) for the custom
  caret look, but the `<input>` now gets an accessible name via `aria-label={placeholder}`
  — so `getByLabel('...')` matches (there is still no real `placeholder` attribute, so
  `getByPlaceholder` does NOT). `Modal` exposes `role="dialog"` + `aria-modal` on its
  content, so `getByRole('dialog')` works. E2E uses these semantic selectors.
- **Playwright boots its own server:** `playwright.config.ts` runs `npm run start:dev`
  (app `:3000` + backend `:8000`) — don't start it manually. There are **two `webServer`
  entries**: the first launches the stack and waits on `:3000`, the second waits on
  `:8000/health` (Playwright allows one URL per entry, and the suite must not start
  before Nest has connected to Postgres). `globalSetup` (`e2e/globalSetup.ts`) reseeds
  the DB from `db.json` before every run — **it wipes anything you created by hand.**
  Browser download is a one-time `npx playwright install chromium` (pinned Chromium, not
  your system Chrome). `e2e/` and `playwright.config.ts` are **excluded from `tsc`**
  (root tsconfig loads only jest types) — Playwright type-checks specs itself at run time.
- **Headed Chromium can fail on Windows with a SxS error** ("side-by-side configuration
  is incorrect" / "Dependent Assembly … could not be found"): the bundled full `chrome.exe`
  won't launch even with a clean, complete `install` — a machine-level Windows runtime
  issue, NOT a Playwright/project problem (headless `chrome-headless-shell` is monolithic
  and still works, so `npm run e2e` is fine). Fix baked in: the `chromium` project reads
  `channel: process.env.PW_CHANNEL`, and the **`e2e:ui` / `e2e:headed` scripts set
  `cross-env PW_CHANNEL=chrome`** so headed/UI mode just works out of the box (needs system
  Chrome installed). Base `npm run e2e` leaves `PW_CHANNEL` unset → bundled Chromium
  (headless, CI default). Manual override still works: `$env:PW_CHANNEL="msedge"` etc.
- **E2E is NOT in the CI chain** (`main.yml`) yet — it's a separate `npm run e2e`. The
  green-before-done chain below stays jest-only. Coverage so far: `e2e/auth.spec.ts`
  (login, token persistence, RBAC redirect) and `e2e/article.spec.ts` (posting a comment,
  rating an article, creating an article — including validation). **Writes are no longer
  stubbed**: with a real database there is nothing to protect, so the tests assert actual
  persistence (a comment survives a reload; a rating flips the card permanently). The old
  `page.route` stubs only proved the frontend *sent* the right request. Repeatability now
  comes from `globalSetup` reseeding instead.
  Watch out for seeded state when writing new specs: article ids are **not contiguous**
  (1, 3, 18…51), and admin already rates articles 1, 28 and 29 — the rating spec uses
  article 34 for that reason. Shared login/creds live in `e2e/helpers.ts`.
- **`lint:fsd` (steiger) has a known nondeterministic false-positive**: an import that's
  correctly downgraded to a warning by a `steiger.config.ts` override (e.g. the
  `model/**` or `shared/lib/tests/**` glob) can occasionally get reported as a hard
  **error** instead — confirmed reproducible even on a clean tree with zero pending
  changes (not caused by any specific edit). If `lint:fsd` reports exactly one error on
  a file/pattern that's covered by an existing override in `steiger.config.ts`, that's
  this flake, not a real architecture violation — rerun it before assuming your change
  broke something; don't chase it by restructuring unrelated code.

## Verification & workflow

- After edits, prefer running only the affected checks first (type:check, eslint on
  changed files, stylelint on changed scss), then the full chain before declaring done.
- `type:check` is the source of truth for type errors and matches the IDE (bundler).
- Do NOT commit/push unless asked. If on `main`, branch first. Current branch:
  **`feat/headlessui`** (working branch for this stream of work).
- Do NOT manually verify in the browser (Chrome MCP: navigate, screenshot, click through
  flows, check console/network) by default. Running the CI chain (type:check, lint, unit,
  build) is enough to call a change done. Only do live browser verification when the user
  explicitly asks for it.

## Reference architecture example (Comments)

Clean pattern to imitate:
```
entities/Comment         — CommentCard, CommentList, CommentForm (presentational), type
features/ArticleComments — api/ (RTK Query) + ui/ (composes list + form for an article)
pages/ArticleDetailsPage — just <ArticleComments id={id} />
```
Pages should be thin composition shells; page-specific UI (e.g. `ArticlesPageList`)
connects to its own slice directly rather than prop-drilling from the page.
