import { Article, ArticleBlockType, ArticleCodeBlock } from '@/entities/Article';

export interface DailySnippet {
    code: string;
    article: Article;
}

const getDayOfYear = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diffMs = date.getTime() - startOfYear.getTime();
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor(diffMs / msPerDay);
};

/**
 * Deterministically picks one CODE block per day out of the given articles.
 * Same `date` (same calendar day) always yields the same snippet; the pick
 * rotates as the day changes. Pure — no React, no store — so it's cheap to
 * unit-test the rotation/stability logic in isolation.
 */
export const pickSnippetOfTheDay = (
    articles: Article[] | undefined,
    date: Date = new Date(),
): DailySnippet | undefined => {
    if (!articles?.length) {
        return undefined;
    }

    const candidates = articles
        .map((article) => {
            const codeBlock = article.blocks.find(
                (block): block is ArticleCodeBlock =>
                    block.type === ArticleBlockType.CODE,
            );
            return codeBlock ? { article, codeBlock } : undefined;
        })
        .filter((candidate): candidate is NonNullable<typeof candidate> => !!candidate);

    if (!candidates.length) {
        return undefined;
    }

    const index = getDayOfYear(date) % candidates.length;
    const { article, codeBlock } = candidates[index];

    return { code: codeBlock.code, article };
};
