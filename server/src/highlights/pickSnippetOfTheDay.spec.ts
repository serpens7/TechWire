import { pickSnippetOfTheDay } from './pickSnippetOfTheDay';

/**
 * Тест перенесён с фронта вместе с самой логикой: выбор сниппета переехал
 * на сервер, когда чтение каталога закрыли для незалогиненных.
 */

const makeArticle = (id: string, code?: string) => ({
    id,
    title: `Article ${id}`,
    blocks: code
        ? [{ id: `${id}-code`, type: 'CODE', code }]
        : [{ id: `${id}-text`, type: 'TEXT', paragraphs: ['no code here'] }],
});

describe('pickSnippetOfTheDay', () => {
    it('на пустом входе ничего не выбирает', () => {
        expect(pickSnippetOfTheDay(undefined)).toBeUndefined();
        expect(pickSnippetOfTheDay([])).toBeUndefined();
    });

    it('ничего не выбирает, если ни в одной статье нет блока с кодом', () => {
        expect(pickSnippetOfTheDay([makeArticle('1'), makeArticle('2')])).toBeUndefined();
    });

    it('пропускает статьи без блока кода', () => {
        const result = pickSnippetOfTheDay(
            [makeArticle('1'), makeArticle('2', 'const a = 1;')],
            new Date(2024, 0, 1),
        );

        expect(result?.article.id).toBe('2');
        expect(result?.code).toBe('const a = 1;');
    });

    it('в пределах одного дня выбор не меняется', () => {
        const articles = [
            makeArticle('1', 'code-a'),
            makeArticle('2', 'code-b'),
            makeArticle('3', 'code-c'),
        ];

        expect(pickSnippetOfTheDay(articles, new Date(2024, 5, 15, 8, 0, 0))).toEqual(
            pickSnippetOfTheDay(articles, new Date(2024, 5, 15, 23, 59, 0)),
        );
    });

    it('со сменой дня выбор сдвигается', () => {
        const articles = [
            makeArticle('1', 'code-a'),
            makeArticle('2', 'code-b'),
            makeArticle('3', 'code-c'),
        ];

        expect(pickSnippetOfTheDay(articles, new Date(2024, 0, 1))?.code).not.toBe(
            pickSnippetOfTheDay(articles, new Date(2024, 0, 2))?.code,
        );
    });

    it('идёт по кругу, когда день года превышает число кандидатов', () => {
        const articles = [makeArticle('1', 'code-a'), makeArticle('2', 'code-b')];

        // 1 % 2 и 3 % 2 дают один и тот же индекс.
        expect(pickSnippetOfTheDay(articles, new Date(2024, 0, 1))?.code).toBe(
            pickSnippetOfTheDay(articles, new Date(2024, 0, 3))?.code,
        );
    });

    it('берёт первый блок кода, если их несколько', () => {
        const article = {
            id: '1',
            title: 'Multi-block article',
            blocks: [
                { id: 'text-1', type: 'TEXT', paragraphs: ['intro'] },
                { id: 'code-1', type: 'CODE', code: 'first' },
                { id: 'code-2', type: 'CODE', code: 'second' },
            ],
        };

        expect(pickSnippetOfTheDay([article], new Date(2024, 0, 1))?.code).toBe('first');
    });

    it('устойчив к неожиданной форме blocks', () => {
        // blocks — JSON-колонка, поэтому теоретически там может оказаться что угодно.
        expect(pickSnippetOfTheDay([{ id: '1', title: 't', blocks: null }])).toBeUndefined();
        expect(pickSnippetOfTheDay([{ id: '1', title: 't', blocks: 'строка' }])).toBeUndefined();
        expect(
            pickSnippetOfTheDay([{ id: '1', title: 't', blocks: [{ type: 'CODE' }] }]),
        ).toBeUndefined();
    });
});
