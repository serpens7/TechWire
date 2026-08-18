import type { components } from '@/shared/api/generated/schema';

/**
 * Типы тизеров берутся прямо из схемы бэкенда — руками их описывать незачем.
 *
 * В отличие от `Article`, здесь нет перечислений, используемых как значения,
 * поэтому сгенерированный тип подходит без оговорок. Пересобирается командой
 * `npm run api:sync`.
 */
export type Highlights = components['schemas']['HighlightsDto'];

export type ArticleTeaser = NonNullable<Highlights['articleOfTheDay']>;
export type SnippetTeaser = NonNullable<Highlights['snippetOfTheDay']>;
