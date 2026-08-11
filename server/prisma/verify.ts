/**
 * Приёмочная проверка перенесённых данных.
 * Запуск: npm run db:verify
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

let failed = 0;

function check(label: string, condition: boolean, detail = ''): void {
    if (!condition) {
        failed += 1;
    }

    console.log(`${condition ? '  OK  ' : ' ПРОВАЛ'} | ${label}${detail ? ` — ${detail}` : ''}`);
}

async function main(): Promise<void> {
    const raw = JSON.parse(
        readFileSync(resolve(__dirname, '../../json-server/db.json'), 'utf-8'),
    ) as Record<string, unknown[]>;

    console.log('\n--- объёмы (БД против db.json) ---');
    const counts = {
        users: await prisma.user.count(),
        profiles: await prisma.profile.count(),
        articles: await prisma.article.count(),
        comments: await prisma.comment.count(),
        notifications: await prisma.notification.count(),
        ratings: await prisma.rating.count(),
    };
    check('users', counts.users === raw.users.length, `${counts.users} из ${raw.users.length}`);
    check('profiles', counts.profiles === raw.profile.length, `${counts.profiles} из ${raw.profile.length}`);
    check('articles', counts.articles === raw.articles.length, `${counts.articles} из ${raw.articles.length}`);
    check('comments', counts.comments === raw.comments.length, `${counts.comments} из ${raw.comments.length}`);
    check('notifications', counts.notifications === raw.notifications.length, `${counts.notifications} из ${raw.notifications.length}`);
    check('ratings', counts.ratings === raw['article-ratings'].length, `${counts.ratings} из ${raw['article-ratings'].length}`);

    const articles = await prisma.article.findMany({ include: { user: true } });
    const blocks = articles.reduce((n, a) => n + (a.blocks as unknown[]).length, 0);
    const rawBlocks = (raw.articles as { blocks: unknown[] }[]).reduce((n, a) => n + a.blocks.length, 0);
    check('блоки внутри статей', blocks === rawBlocks, `${blocks} из ${rawBlocks}`);

    console.log('\n--- идентификаторы ---');
    const numericIds = articles.filter((a) => /^\d+$/.test(a.id)).length;
    check('id статей сохранены как в db.json', numericIds === articles.length, `${numericIds} числовых`);
    const a1 = await prisma.article.findUnique({ where: { id: '1' }, include: { user: true } });
    check('статья id=1 доступна (на неё ходят e2e)', a1 !== null, a1 ? `"${a1.title}"` : '');

    console.log('\n--- даты ---');
    if (a1) {
        const rawA1 = (raw.articles as { id: string; createdAt: string }[]).find((a) => a.id === '1');
        const iso = a1.createdAt.toISOString().slice(0, 10);
        const [d, m, y] = (rawA1?.createdAt ?? '').split('.');
        check('createdAt разобран верно', iso === `${y}-${m}-${d}`, `${rawA1?.createdAt} → ${iso}`);
    }
    const byDate = await prisma.article.findMany({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
    const years = byDate.map((a) => a.createdAt.getUTCFullYear());
    const sorted = years.every((y, i) => i === 0 || years[i - 1] <= y);
    check('сортировка по дате настоящая, а не лексическая', sorted, `${years[0]} … ${years[years.length - 1]}`);

    console.log('\n--- целостность связей ---');
    const comments = await prisma.comment.findMany({ include: { article: true, user: true } });
    const notifications = await prisma.notification.findMany({ include: { user: true } });
    const ratings = await prisma.rating.findMany({ include: { article: true, user: true } });
    check('у всех статей есть автор', articles.every((a) => a.user !== null));
    check('у всех комментариев есть статья и автор', comments.every((c) => c.article && c.user));
    check('у всех уведомлений есть пользователь', notifications.every((n) => n.user));
    check('у всех рейтингов есть статья и пользователь', ratings.every((r) => r.article && r.user));

    console.log('\n--- профиль ---');
    const profile = await prisma.profile.findUnique({ where: { id: '1' }, include: { user: true } });
    check('профиль связан с пользователем', profile?.user.username === 'admin', profile?.user.username);
    check('username/avatar не дублируются в profiles', !('username' in (profile ?? {})));

    console.log('\n--- пароли ---');
    const users = raw.users as { username: string; password: string }[];
    for (const rawUser of users) {
        const user = await prisma.user.findUnique({ where: { username: rawUser.username } });
        check(
            `${rawUser.username}: исходный пароль подходит`,
            user !== null && (await bcrypt.compare(rawUser.password, user.password)),
        );
        check(`${rawUser.username}: хранится bcrypt-хэшем`, user!.password.startsWith('$2'));
    }
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    check('неверный пароль отвергается', !(await bcrypt.compare('заведомо-неверный', admin!.password)));
    check('роли admin перенесены', admin!.roles.includes('ADMIN'), JSON.stringify(admin!.roles));

    console.log(`\n${failed === 0 ? 'ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ' : `ПРОВАЛОВ: ${failed}`}\n`);

    await prisma.$disconnect();

    if (failed > 0) {
        process.exit(1);
    }
}

void main();
