import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Логин обязателен'),
    password: z.string().min(1, 'Пароль обязателен'),
});

export type LoginDto = z.infer<typeof loginSchema>;

export class LoginBodyDto extends createZodDto(loginSchema) {}
