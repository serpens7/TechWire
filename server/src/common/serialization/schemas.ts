import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Схемы ответов API — единственный источник правды о том, что бэкенд отдаёт.
 *
 * Из них получаются сразу три вещи:
 *  1. типы, которыми аннотированы сериализаторы (несоответствие ловит tsc);
 *  2. схема OpenAPI (через createZodDto → SwaggerModule);
 *  3. типы для фронта (openapi-typescript по сгенерированному openapi.json).
 *
 * Это и убирает дублирование: раньше форма ответа существовала трижды —
 * в сериализаторе, в типах фронта и в голове разработчика.
 */

export const userSchema = z.object({
    id: z.string(),
    username: z.string(),
    avatar: z.string().optional(),
    roles: z.array(z.enum(['ADMIN', 'MANAGER', 'USER'])),
});

/** Блоки статьи полиморфны: у каждого типа свой набор полей. */
export const articleBlockSchema = z.discriminatedUnion('type', [
    z.object({ id: z.string(), type: z.literal('CODE'), code: z.string() }),
    z.object({ id: z.string(), type: z.literal('IMAGE'), src: z.string(), title: z.string() }),
    z.object({
        id: z.string(),
        type: z.literal('TEXT'),
        title: z.string().optional(),
        paragraphs: z.array(z.string()),
    }),
]);

const articleBaseSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    img: z.string(),
    views: z.number().int(),
    /** Формат унаследован от json-server; в БД лежит настоящая дата. */
    createdAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/),
    userId: z.string(),
    type: z.array(z.enum(['IT', 'SCIENCE', 'ECONOMICS'])),
    blocks: z.array(articleBlockSchema),
});

/** Ответ без _expand=user — эту же форму фронт отправляет обратно на PUT. */
export const articleSchema = articleBaseSchema;

/** Ответ с _expand=user: автор развёрнут, но userId остаётся. */
export const articleWithUserSchema = articleBaseSchema.extend({ user: userSchema });

const commentBaseSchema = z.object({
    id: z.string(),
    text: z.string(),
    articleId: z.string(),
    userId: z.string(),
    /** Есть только у ответа — всегда указывает на корневой комментарий. */
    parentId: z.string().optional(),
    /** Кому адресован ответ. Отсутствует у корневых комментариев. */
    replyToUserId: z.string().optional(),
});

export const commentSchema = commentBaseSchema;
export const commentWithUserSchema = commentBaseSchema.extend({
    user: userSchema,
    replyToUser: userSchema.optional(),
});

export const profileSchema = z.object({
    id: z.string(),
    first: z.string().optional(),
    lastname: z.string().optional(),
    age: z.number().int().optional(),
    currency: z.enum(['RUB', 'EUR', 'USD']).optional(),
    // Опечатка в значении Казахстана унаследована от фронта.
    country: z.enum(['Russia', 'Belarus', 'Ukraine', 'Kazahstan', 'Armenia']).optional(),
    city: z.string().optional(),
    /** Короткая цитата/статус — то, что человек сам хочет о себе сказать. */
    status: z.string().optional(),
    /** Склеивается из связанного User — в таблице профиля этих полей нет. */
    username: z.string(),
    avatar: z.string().optional(),
});

export const notificationSchema = z.object({
    id: z.string(),
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    href: z.string().optional(),
    isViewed: z.boolean(),
});

export const ratingSchema = z.object({
    id: z.string(),
    userId: z.string(),
    articleId: z.string(),
    rate: z.number().int().min(1).max(5),
    feedback: z.string().optional(),
});

/**
 * Публичная карточка автора (GET /users/:id) — уже profileSchema, но не
 * настолько: пользователь сам решает показать возраст, город и статус на
 * публичной странице (это то же самое, что он вводит в форме профиля).
 * currency и country остаются закрыты токеном (/profile/:id) — они не несут
 * смысла вне формы редактирования и не то, что стоит выставлять напоказ.
 */
export const publicAuthorSchema = z.object({
    id: z.string(),
    username: z.string(),
    avatar: z.string().optional(),
    first: z.string().optional(),
    lastname: z.string().optional(),
    age: z.number().int().optional(),
    city: z.string().optional(),
    status: z.string().optional(),
    articlesCount: z.number().int(),
});

export const loginResponseSchema = z.object({
    user: userSchema,
    token: z.string(),
});

/**
 * Тизеры для главной — единственные данные о статьях, доступные без входа.
 *
 * Сознательно урезаны: у статьи дня нет `blocks`, у сниппета — только один
 * блок кода и минимум о статье. Прочитать статью по этим данным нельзя,
 * поэтому «войдите, чтобы читать» — настоящее ограничение, а не украшение
 * интерфейса.
 */
const articleTeaserSchema = z.object({
    id: z.string(),
    title: z.string(),
    subtitle: z.string(),
    img: z.string(),
    views: z.number().int(),
    createdAt: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/),
    type: z.array(z.enum(['IT', 'SCIENCE', 'ECONOMICS'])),
    user: userSchema,
});

const snippetTeaserSchema = z.object({
    code: z.string(),
    article: z.object({
        id: z.string(),
        title: z.string(),
        user: userSchema,
    }),
});

export const highlightsSchema = z.object({
    articleOfTheDay: articleTeaserSchema.nullable(),
    snippetOfTheDay: snippetTeaserSchema.nullable(),
});

export const healthSchema = z.object({
    status: z.string(),
    db: z.string(),
});

// --- типы ------------------------------------------------------------------

export type UserResponse = z.infer<typeof userSchema>;
export type ArticleResponse = z.infer<typeof articleSchema>;
export type ArticleWithUserResponse = z.infer<typeof articleWithUserSchema>;
export type CommentResponse = z.infer<typeof commentSchema>;
export type CommentWithUserResponse = z.infer<typeof commentWithUserSchema>;
export type ProfileResponse = z.infer<typeof profileSchema>;
export type PublicAuthorResponse = z.infer<typeof publicAuthorSchema>;
export type NotificationResponse = z.infer<typeof notificationSchema>;
export type RatingResponse = z.infer<typeof ratingSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type ArticleTeaser = z.infer<typeof articleTeaserSchema>;
export type SnippetTeaser = z.infer<typeof snippetTeaserSchema>;
export type Highlights = z.infer<typeof highlightsSchema>;

// --- DTO для Swagger -------------------------------------------------------
// Имена классов становятся именами схем в OpenAPI, а затем — ключами в
// сгенерированных типах фронта. Менять их не стоит без нужды.

export class UserDto extends createZodDto(userSchema) {}
export class ArticleDto extends createZodDto(articleSchema) {}
export class ArticleWithUserDto extends createZodDto(articleWithUserSchema) {}
export class CommentDto extends createZodDto(commentSchema) {}
export class CommentWithUserDto extends createZodDto(commentWithUserSchema) {}
export class ProfileDto extends createZodDto(profileSchema) {}
export class PublicAuthorDto extends createZodDto(publicAuthorSchema) {}
export class NotificationDto extends createZodDto(notificationSchema) {}
export class RatingDto extends createZodDto(ratingSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
export class HealthDto extends createZodDto(healthSchema) {}
export class HighlightsDto extends createZodDto(highlightsSchema) {}
