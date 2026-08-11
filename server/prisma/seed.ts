/**
 * Наполнение БД из json-server/db.json.
 *
 * Свойства, на которые опирается всё остальное:
 *  - идемпотентность: всё через upsert по id, повторный прогон не плодит дублей;
 *  - идентификаторы сохраняются как есть ("1".."36") — на них завязаны
 *    e2e-тесты (/articles/1) и моки сторисов;
 *  - пары логин/пароль не меняются (admin/123, user2/321), меняется только
 *    способ хранения: bcrypt вместо открытого текста.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import type { ArticleType, Country, Currency, UserRole } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL не задан — скопируйте .env.example в .env и заполните');
}

// Prisma 7: подключение приходит в клиент через driver adapter, а не из схемы.
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const BCRYPT_ROUNDS = 10;
const DB_JSON = resolve(__dirname, '../../json-server/db.json');

interface RawUser {
    id: string;
    username: string;
    password: string;
    roles?: string[];
    avatar?: string;
}

interface RawProfile {
    id: string;
    first?: string;
    lastname?: string;
    age?: number;
    currency?: string;
    country?: string;
    city?: string;
    username?: string;
    avatar?: string;
}

interface RawArticle {
    id: string;
    title: string;
    subtitle: string;
    img: string;
    views: number;
    createdAt: string;
    userId: string;
    type: string[];
    blocks: unknown[];
}

interface RawComment {
    id: string;
    text: string;
    articleId: string;
    userId: string;
}

interface RawNotification {
    id: string;
    title: string;
    description?: string;
    href?: string;
    userId: string;
    isViewed?: boolean;
}

interface RawRating {
    id: string;
    rate: number;
    feedback?: string;
    articleId: string;
    userId: string;
}

interface RawDb {
    users: RawUser[];
    profile: RawProfile[];
    articles: RawArticle[];
    comments: RawComment[];
    notifications: RawNotification[];
    'article-ratings': RawRating[];
}

/**
 * В db.json дата лежит строкой "DD.MM.YYYY". Полдень UTC — чтобы сдвиг
 * часового пояса не перекидывал дату на соседний день при обратной
 * сериализации.
 */
function parseRuDate(value: string): Date {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);

    if (!match) {
        throw new Error(`Неожиданный формат даты: "${value}" (ожидался DD.MM.YYYY)`);
    }

    const [, day, month, year] = match;

    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
}

async function main() {
    const db = JSON.parse(readFileSync(DB_JSON, 'utf-8')) as RawDb;

    // --- users -------------------------------------------------------------
    for (const user of db.users) {
        const password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
        const data = {
            username: user.username,
            password,
            avatar: user.avatar ?? null,
            roles: (user.roles ?? ['USER']) as UserRole[],
        };

        await prisma.user.upsert({
            where: { id: user.id },
            create: { id: user.id, ...data },
            update: data,
        });
    }

    // --- profiles ----------------------------------------------------------
    // username/avatar сознательно не переносим: в ответе API они берутся из
    // связанного User, чтобы не держать две копии одного значения.
    for (const profile of db.profile) {
        const owner = db.users.find((u) => u.username === profile.username);

        if (!owner) {
            throw new Error(`Профиль ${profile.id}: не найден пользователь "${profile.username}"`);
        }

        const data = {
            first: profile.first ?? null,
            lastname: profile.lastname ?? null,
            age: profile.age ?? null,
            currency: (profile.currency ?? null) as Currency | null,
            country: (profile.country ?? null) as Country | null,
            city: profile.city ?? null,
            userId: owner.id,
        };

        await prisma.profile.upsert({
            where: { id: profile.id },
            create: { id: profile.id, ...data },
            update: data,
        });
    }

    // --- articles ----------------------------------------------------------
    for (const article of db.articles) {
        const data = {
            title: article.title,
            subtitle: article.subtitle,
            img: article.img,
            views: article.views,
            createdAt: parseRuDate(article.createdAt),
            type: article.type as ArticleType[],
            blocks: article.blocks as never,
            userId: String(article.userId),
        };

        await prisma.article.upsert({
            where: { id: article.id },
            create: { id: article.id, ...data },
            update: data,
        });
    }

    // --- comments ----------------------------------------------------------
    for (const comment of db.comments) {
        const data = {
            text: comment.text,
            articleId: String(comment.articleId),
            userId: String(comment.userId),
        };

        await prisma.comment.upsert({
            where: { id: comment.id },
            create: { id: comment.id, ...data },
            update: data,
        });
    }

    // --- notifications -----------------------------------------------------
    for (const notification of db.notifications) {
        const data = {
            title: notification.title,
            description: notification.description ?? null,
            href: notification.href ?? null,
            isViewed: notification.isViewed ?? false,
            userId: String(notification.userId),
        };

        await prisma.notification.upsert({
            where: { id: notification.id },
            create: { id: notification.id, ...data },
            update: data,
        });
    }

    // --- ratings -----------------------------------------------------------
    for (const rating of db['article-ratings']) {
        const data = {
            rate: rating.rate,
            feedback: rating.feedback ?? null,
            articleId: String(rating.articleId),
            userId: String(rating.userId),
        };

        await prisma.rating.upsert({
            where: { id: rating.id },
            create: { id: rating.id, ...data },
            update: data,
        });
    }

    const counts = {
        users: await prisma.user.count(),
        profiles: await prisma.profile.count(),
        articles: await prisma.article.count(),
        comments: await prisma.comment.count(),
        notifications: await prisma.notification.count(),
        ratings: await prisma.rating.count(),
    };

    const blocks = (await prisma.article.findMany({ select: { blocks: true } })).reduce(
        (total, article) => total + (article.blocks as unknown[]).length,
        0,
    );

    console.log('Сид завершён:', { ...counts, blocks });
}

main()
    .then(() => prisma.$disconnect())
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
