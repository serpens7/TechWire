# Бэкенд production-project

NestJS 11 (на Fastify) + Prisma 7 + PostgreSQL 17. Заменяет `json-server/`.

Пакет намеренно самодостаточен — свои `package.json`, `tsconfig`, `node_modules`.
Nest требует CommonJS, декораторов и `emitDecoratorMetadata`, что несовместимо с
фронтовым `tsconfig` (`jsx: react-jsx`, `moduleResolution: bundler`).

## Запуск

Разово:

```bash
npm install
cp .env.example .env      # вписать пароль postgres
npm run db:migrate        # создаст базу и накатит схему
npm run db:seed           # перенесёт данные из ../json-server/db.json
```

PostgreSQL стоит нативно, служба в режиме `Manual` — перед работой поднять
(нужна консоль администратора):

```bash
Start-Service postgresql-x64-17
```

Дальше:

```bash
npm run start:dev         # :8000 с автоперезапуском
npm run db:verify         # приёмка: БД против db.json
```

## Скрипты

| Команда | Что делает |
|---|---|
| `npm run start:dev` | dev-сервер с watch |
| `npm run build` / `start:prod` | сборка и запуск (`dist/src/main.js`) |
| `npm run type:check` | `tsc --noEmit` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | сид из `db.json` (идемпотентный) |
| `npm run db:reset` | пересоздать базу с нуля и засеять |
| `npm run db:verify` | сверить содержимое БД с `db.json` |

## Контракт API

Имена query-параметров унаследованы от json-server (`_limit`, `_page`, `_sort`,
`_order`, `q`, `_expand`) **осознанно**: так фронт не потребовал ни одной правки,
а существующий набор Playwright-тестов работает приёмочным тестом подмены
бэкенда. Причёсывание API до нормального REST — отдельная задача.

| Метод | Путь | Параметры |
|---|---|---|
| GET | `/articles` | `_expand=user`, `_limit`, `_page`, `_sort`, `_order`, `q`, `type` |
| GET | `/articles/:id` | `_expand=user` |
| GET | `/comments` | `articleId`, `_expand=user` |
| GET | `/notifications` | `userId` |
| GET | `/article-ratings` | `userId`, `articleId` |
| GET | `/profile/:id` | — |
| POST | `/login` | `{ username, password }` → `{ user, token }` |
| GET | `/auth/me` | текущий пользователь по токену |
| POST | `/articles` | только `ADMIN` |
| PUT | `/articles/:id` | только `ADMIN` |
| POST | `/comments` | `{ articleId, text }` |
| POST | `/article-ratings` | `{ articleId, rate, feedback? }`, upsert |
| PUT | `/profile/:id` | только свой профиль |
| GET | `/health` | проверка живости + доступности БД |

Закрыто по умолчанию: без токена не отвечает ничего, кроме `/login` и `/health`
(глобальный `JwtAuthGuard`, исключения помечаются `@Public()`).

**`userId` из тела запроса всегда игнорируется** — автор комментария, статьи и
оценки берётся из токена. Иначе можно было бы написать от чужого имени: фронт
этот `userId` присылает, json-server его послушно использовал.

## Осознанные отличия от json-server

Проверялись сравнением ответов обоих бэкендов на одинаковых запросах.
Совпало всё, кроме трёх пунктов — и все три намеренные.

**1. Пароли больше не утекают.** json-server возвращал `user.password` открытым
текстом внутри каждой статьи и каждого комментария при `_expand=user`. Наружу
уходят только `id`, `username`, `avatar`, `roles`.

**2. Фильтр по типу чинится.** `type` — массив, а json-server сравнивал его
целиком, поэтому статья с двумя типами (`["ECONOMICS","IT"]`) не попадала ни под
`type=IT`, ни под `type=ECONOMICS`. Таких статей 6 из 36 — они были невидимы во
всех фильтрах. Теперь проверяется вхождение: `type=IT` даёт 22 статьи вместо 17.

**3. Поиск сузился до заголовка и подзаголовка.** json-server искал по всему
содержимому записи, включая блоки с кодом: запрос `Javascript` возвращал 19
статей из 36, потому что слово попадалось в примерах кода. Теперь ищем там, где
это осмысленно.

Плюс два исправления на уровне схемы, невидимые в ответах:

- `createdAt` хранится настоящей датой. В `db.json` это была строка
  `"DD.MM.YYYY"`, и `_sort=createdAt` сортировал её лексически — то есть
  неверно. Наружу дата по-прежнему уходит в формате `DD.MM.YYYY`.
- `username` и `avatar` не дублируются в `profiles` (в `db.json` они лежали и в
  `users`, и в `profile`) — в ответе склеиваются из связанного `User`.

## Данные

Источник — `../json-server/db.json`, он остаётся в репозитории как сид.
Идентификаторы сохраняются один в один (1, 3, 18…51 — они не сплошные): на них завязаны
e2e-тесты (`/articles/1`) и моки сторисов. Для новых записей — `cuid()`.

Пары логин/пароль не менялись (`admin`/`123`, `user2`/`321`), изменилось только
хранение — bcrypt вместо открытого текста.

## Заметки по Prisma 7

- `url` в блоке `datasource` больше не поддерживается: для CLI строка
  подключения берётся из `prisma.config.ts`, а клиент получает её через driver
  adapter (`@prisma/adapter-pg`) в конструкторе.
- Сид гоняется через `tsx`, а не `ts-node`: генератор `prisma-client` отдаёт
  клиент исходниками на TypeScript, но со спецификаторами `.js` в импортах
  (`require('./internal/class.js')` при файле `class.ts`), которые `ts-node` в
  CommonJS-режиме не разрешает.
- `prisma init` дополнительно скачивает skill-файлы для AI-агентов
  (`.claude/skills/`, `.agents/`, `skills-lock.json`) — из проекта удалены.
