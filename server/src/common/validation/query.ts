import { z } from 'zod';

/**
 * Хелперы для query-параметров.
 *
 * Общая проблема: axios отправляет пустую строку там, где значения нет
 * (например q= при пустом поиске), а не опускает параметр. Пустую строку
 * трактуем как «фильтр не задан».
 */

export const optionalString = z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.string().optional(),
);

export const optionalPositiveInt = z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().positive().optional(),
);

export function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
    return z.preprocess((value) => (value === '' ? undefined : value), z.enum(values).optional());
}
