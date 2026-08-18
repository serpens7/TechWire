import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Логин должен быть не короче 3 символов')
        .max(32, 'Логин должен быть не длиннее 32 символов')
        .regex(/^[A-Za-z0-9_-]+$/, 'Логин может содержать только латиницу, цифры, _ и -'),
    // 72 — предел bcrypt: он молча обрезает более длинный пароль, не сообщая об этом.
    password: z
        .string()
        .min(6, 'Пароль должен быть не короче 6 символов')
        .max(72, 'Пароль должен быть не длиннее 72 символов'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

export class RegisterBodyDto extends createZodDto(registerSchema) {}
