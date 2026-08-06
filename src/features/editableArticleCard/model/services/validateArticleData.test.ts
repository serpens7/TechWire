import { ArticleType } from '@/entities/Article';
import { ValidateArticleError } from '../types/editableArticleCardSchema';
import { validateArticleData } from './validateArticleData';

const data = {
    title: 'Title',
    subtitle: 'Subtitle',
    img: 'https://example.com/img.png',
    type: [ArticleType.IT],
};

describe('validateArticleData.test', () => {
    test('success', () => {
        expect(validateArticleData(data)).toEqual([]);
    });

    test('no title', () => {
        expect(validateArticleData({ ...data, title: '' })).toEqual([
            ValidateArticleError.NO_TITLE,
        ]);
    });

    test('no subtitle', () => {
        expect(validateArticleData({ ...data, subtitle: '' })).toEqual([
            ValidateArticleError.NO_SUBTITLE,
        ]);
    });

    test('no image', () => {
        expect(validateArticleData({ ...data, img: '' })).toEqual([
            ValidateArticleError.NO_IMAGE,
        ]);
    });

    test('no type', () => {
        expect(validateArticleData({ ...data, type: [] })).toEqual([
            ValidateArticleError.NO_TYPE,
        ]);
    });

    test('no data at all', () => {
        expect(validateArticleData(undefined)).toEqual([
            ValidateArticleError.NO_DATA,
        ]);
    });

    test('all fields missing', () => {
        expect(validateArticleData({})).toEqual([
            ValidateArticleError.NO_TITLE,
            ValidateArticleError.NO_SUBTITLE,
            ValidateArticleError.NO_IMAGE,
            ValidateArticleError.NO_TYPE,
        ]);
    });
});
