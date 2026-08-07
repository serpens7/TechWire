import { Article, ArticleBlockType, ArticleType } from '@/entities/Article';
import { pickSnippetOfTheDay } from './pickSnippetOfTheDay';

const baseUser = { id: '1', username: 'admin' };

const makeArticle = (id: string, code?: string): Article => ({
    id,
    title: `Article ${id}`,
    subtitle: 'subtitle',
    img: 'img.png',
    views: 0,
    createdAt: '01.01.2022',
    user: baseUser,
    type: [ArticleType.IT],
    blocks: code
        ? [{ id: `${id}-code`, type: ArticleBlockType.CODE, code }]
        : [{ id: `${id}-text`, type: ArticleBlockType.TEXT, paragraphs: ['no code here'] }],
});

describe('pickSnippetOfTheDay', () => {
    test('returns undefined for undefined input', () => {
        expect(pickSnippetOfTheDay(undefined)).toBeUndefined();
    });

    test('returns undefined for empty input', () => {
        expect(pickSnippetOfTheDay([])).toBeUndefined();
    });

    test('returns undefined when no article has a CODE block', () => {
        const articles = [makeArticle('1'), makeArticle('2')];
        expect(pickSnippetOfTheDay(articles)).toBeUndefined();
    });

    test('filters out articles without CODE blocks', () => {
        const articles = [
            makeArticle('1'), // no code
            makeArticle('2', 'const a = 1;'),
        ];
        const result = pickSnippetOfTheDay(articles, new Date(2024, 0, 1));
        expect(result?.article.id).toBe('2');
        expect(result?.code).toBe('const a = 1;');
    });

    test('same date yields the same snippet (stable within a day)', () => {
        const articles = [
            makeArticle('1', 'code-a'),
            makeArticle('2', 'code-b'),
            makeArticle('3', 'code-c'),
        ];
        const date = new Date(2024, 5, 15, 8, 0, 0);
        const dateLater = new Date(2024, 5, 15, 23, 59, 0);

        expect(pickSnippetOfTheDay(articles, date)).toEqual(
            pickSnippetOfTheDay(articles, dateLater),
        );
    });

    test('different days advance through candidates (rotation)', () => {
        const articles = [
            makeArticle('1', 'code-a'),
            makeArticle('2', 'code-b'),
            makeArticle('3', 'code-c'),
        ];

        const day1 = pickSnippetOfTheDay(articles, new Date(2024, 0, 1));
        const day2 = pickSnippetOfTheDay(articles, new Date(2024, 0, 2));

        expect(day1?.code).not.toBe(day2?.code);
    });

    test('wraps around when day-of-year exceeds the candidate count', () => {
        const articles = [
            makeArticle('1', 'code-a'),
            makeArticle('2', 'code-b'),
        ];

        // Day 1 (Jan 1) and day 3 (Jan 3) both map to index 1 % 2 === 1 and
        // 3 % 2 === 1 respectively — same candidate, proving the modulo wrap.
        const day1 = pickSnippetOfTheDay(articles, new Date(2024, 0, 1));
        const day3 = pickSnippetOfTheDay(articles, new Date(2024, 0, 3));

        expect(day1?.code).toBe(day3?.code);
    });

    test('picks the first CODE block when an article has multiple blocks', () => {
        const article: Article = {
            id: '1',
            title: 'Multi-block article',
            subtitle: 'subtitle',
            img: 'img.png',
            views: 0,
            createdAt: '01.01.2022',
            user: baseUser,
            type: [ArticleType.IT],
            blocks: [
                { id: 'text-1', type: ArticleBlockType.TEXT, paragraphs: ['intro'] },
                { id: 'code-1', type: ArticleBlockType.CODE, code: 'first' },
                { id: 'code-2', type: ArticleBlockType.CODE, code: 'second' },
            ],
        };

        const result = pickSnippetOfTheDay([article], new Date(2024, 0, 1));
        expect(result?.code).toBe('first');
    });
});
