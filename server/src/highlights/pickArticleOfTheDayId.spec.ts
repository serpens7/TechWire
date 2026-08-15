import { pickArticleOfTheDayId } from './pickArticleOfTheDayId';

describe('pickArticleOfTheDayId', () => {
    it('берёт первую запись — groupBy уже отсортирован по убыванию', () => {
        const result = pickArticleOfTheDayId([{ articleId: '5' }, { articleId: '1' }]);

        expect(result).toBe('5');
    });

    it('пустое окно — undefined (вызывающий код уходит на фолбэк)', () => {
        expect(pickArticleOfTheDayId([])).toBeUndefined();
    });

    it('undefined на входе — undefined на выходе', () => {
        expect(pickArticleOfTheDayId(undefined)).toBeUndefined();
    });
});
