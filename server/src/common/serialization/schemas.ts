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
});

export const commentSchema = commentBaseSchema;
export const commentWithUserSchema = commentBaseSchema.extend({ user: userSchema });

export const profileSchema = z.object({
    id: z.string(),
    first: z.string().optional(),
    lastname: z.string().optional(),
    age: z.number().int().optional(),
    currency: z.enum(['RUB', 'EUR', 'USD']).optional(),
    // Опечатка в значении Казахстана унаследована от фронта.
    country: z.enum(['Russia', 'Belarus', 'Ukraine', 'Kazahstan', 'Armenia']).optional(),
    city: z.string().optional(),
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

export const loginResponseSchema = z.object({
    user: userSchema,
    token: z.string(),
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
export type NotificationResponse = z.infer<typeof notificationSchema>;
export type RatingResponse = z.infer<typeof ratingSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

// --- DTO для Swagger -------------------------------------------------------
// Имена классов становятся именами схем в OpenAPI, а затем — ключами в
// сгенерированных типах фронта. Менять их не стоит без нужды.

export class UserDto extends createZodDto(userSchema) {}
export class ArticleDto extends createZodDto(articleSchema) {}
export class ArticleWithUserDto extends createZodDto(articleWithUserSchema) {}
export class CommentDto extends createZodDto(commentSchema) {}
export class CommentWithUserDto extends createZodDto(commentWithUserSchema) {}
export class ProfileDto extends createZodDto(profileSchema) {}
export class NotificationDto extends createZodDto(notificationSchema) {}
export class RatingDto extends createZodDto(ratingSchema) {}
export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
export class HealthDto extends createZodDto(healthSchema) {}
