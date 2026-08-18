/**
 * Детерминированный выбор одного CODE-блока на день.
 *
 * Логика перенесена с фронта: раньше клиент забирал два десятка статей
 * целиком и выбирал из них сам, но после того как чтение каталога закрыли,
 * такой запрос незалогиненному недоступен. Теперь сервер отдаёт готовый
 * тизер, а не сырьё для него.
 *
 * Чистая функция: ни Nest, ни Prisma — поэтому ротацию дёшево проверять
 * в отрыве от всего остального.
 */

export interface SnippetCandidate {
    id: string;
    title: string;
    blocks: unknown;
}

export interface PickedSnippet<T> {
    code: string;
    article: T;
}

interface CodeBlock {
    type: 'CODE';
    code: string;
}

function findFirstCodeBlock(blocks: unknown): CodeBlock | undefined {
    if (!Array.isArray(blocks)) {
        return undefined;
    }

    return blocks.find(
        (block): block is CodeBlock =>
            typeof block === 'object' &&
            block !== null &&
            (block as { type?: unknown }).type === 'CODE' &&
            typeof (block as { code?: unknown }).code === 'string',
    );
}

function getDayOfYear(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const msPerDay = 1000 * 60 * 60 * 24;

    return Math.floor((date.getTime() - startOfYear.getTime()) / msPerDay);
}

/**
 * Один и тот же календарный день всегда даёт один и тот же сниппет,
 * со сменой дня выбор сдвигается по кругу.
 */
export function pickSnippetOfTheDay<T extends { blocks: unknown }>(
    articles: T[] | undefined,
    date: Date = new Date(),
): PickedSnippet<T> | undefined {
    if (!articles?.length) {
        return undefined;
    }

    const candidates = articles
        .map((article) => {
            const codeBlock = findFirstCodeBlock(article.blocks);

            return codeBlock ? { article, codeBlock } : undefined;
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate));

    if (!candidates.length) {
        return undefined;
    }

    const { article, codeBlock } = candidates[getDayOfYear(date) % candidates.length];

    return { code: codeBlock.code, article };
}
