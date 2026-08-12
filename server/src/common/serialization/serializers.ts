import type {
    Article,
    Comment,
    Notification,
    Profile,
    Rating,
    User,
} from '../../../generated/prisma/client';

/**
 * Слой представления: приводит записи БД к тем формам, которые уже ждёт фронт.
 *
 * Контракт намеренно сохранён один в один с json-server — включая его
 * странности (createdAt строкой "DD.MM.YYYY", userId рядом с развёрнутым
 * user). Это позволяет подменить бэкенд, не трогая фронт, и проверить
 * подмену существующим набором e2e.
 */

/** Поля пользователя, которые вообще можно отдавать наружу. Пароля здесь нет и быть не должно. */
export const publicUserSelect = {
    id: true,
    username: true,
    avatar: true,
    roles: true,
} as const;

type PublicUser = Pick<User, 'id' | 'username' | 'avatar' | 'roles'>;

/** В БД дата настоящая, наружу уходит в том же формате, что лежал в db.json. */
export function formatRuDate(date: Date): string {
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');

    return `${day}.${month}.${date.getUTCFullYear()}`;
}

/**
 * Обратное преобразование: фронт присылает дату строкой "DD.MM.YYYY"
 * (new Date().toLocaleDateString('ru-RU') при создании статьи).
 *
 * Полдень UTC — чтобы сдвиг часового пояса не перекидывал дату на соседний
 * день при обратной сериализации.
 */
export function parseRuDate(value: string): Date {
    const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);

    if (!match) {
        throw new Error(`Неожиданный формат даты: "${value}" (ожидался DD.MM.YYYY)`);
    }

    const [, day, month, year] = match;

    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
}

export function serializeUser(user: PublicUser) {
    return {
        id: user.id,
        username: user.username,
        avatar: user.avatar ?? undefined,
        roles: user.roles,
    };
}

/**
 * `_expand=user` в json-server добавлял развёрнутого автора, но userId при
 * этом оставлял. Повторяем: фронт на пути редактирования запрашивает статью
 * БЕЗ _expand и отправляет тот же объект обратно на PUT.
 */
export function serializeArticle(
    article: Article & { user?: PublicUser | null },
    options: { expandUser?: boolean } = {},
) {
    const base = {
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        img: article.img,
        views: article.views,
        createdAt: formatRuDate(article.createdAt),
        userId: article.userId,
        type: article.type,
        blocks: article.blocks,
    };

    if (options.expandUser && article.user) {
        return { ...base, user: serializeUser(article.user) };
    }

    return base;
}

export function serializeComment(
    comment: Comment & { user?: PublicUser | null },
    options: { expandUser?: boolean } = {},
) {
    const base = {
        id: comment.id,
        text: comment.text,
        articleId: comment.articleId,
        userId: comment.userId,
    };

    if (options.expandUser && comment.user) {
        return { ...base, user: serializeUser(comment.user) };
    }

    return base;
}

/**
 * username и avatar в БД лежат только у User (в db.json они дублировались
 * и в profile) — здесь склеиваем обратно, чтобы ответ не изменился.
 */
export function serializeProfile(profile: Profile & { user: PublicUser }) {
    return {
        id: profile.id,
        first: profile.first ?? undefined,
        lastname: profile.lastname ?? undefined,
        age: profile.age ?? undefined,
        currency: profile.currency ?? undefined,
        country: profile.country ?? undefined,
        city: profile.city ?? undefined,
        username: profile.user.username,
        avatar: profile.user.avatar ?? undefined,
    };
}

export function serializeNotification(notification: Notification) {
    return {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        description: notification.description ?? undefined,
        href: notification.href ?? undefined,
        isViewed: notification.isViewed,
    };
}

export function serializeRating(rating: Rating) {
    return {
        id: rating.id,
        userId: rating.userId,
        articleId: rating.articleId,
        rate: rating.rate,
        feedback: rating.feedback ?? undefined,
    };
}
