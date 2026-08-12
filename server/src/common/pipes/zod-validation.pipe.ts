import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Валидация входных данных схемой zod.
 *
 * Применяется точечно (@Query(new ZodValidationPipe(schema))), а не глобально:
 * так на каждом эндпоинте видно, какая именно схема его защищает.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
    constructor(private readonly schema: ZodType<T>) {}

    transform(value: unknown): T {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            throw new BadRequestException({
                message: 'Некорректные параметры запроса',
                issues: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }

        return result.data;
    }
}
