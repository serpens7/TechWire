import { ArticleType } from '@/entities/Article';
import {
    EditableArticleCardSchema,
    ValidateArticleError,
} from '../types/editableArticleCardSchema';
import { articleFormActions, articleFormReducer } from './articleFormSlice';

const data = {
    title: 'Title',
    subtitle: 'Subtitle',
    img: 'https://example.com/img.png',
    type: [ArticleType.IT],
};

describe('articleFormSlice.test', () => {
    test('test init form', () => {
        const state: DeepPartial<EditableArticleCardSchema> = {};

        expect(
            articleFormReducer(
                state as EditableArticleCardSchema,
                articleFormActions.initForm(data)
            )
        ).toEqual({
            form: data,
        });
    });

    test('test update form merges into the existing form', () => {
        const state: DeepPartial<EditableArticleCardSchema> = {
            form: { title: 'Old title', subtitle: 'Subtitle' },
        };

        expect(
            articleFormReducer(
                state as EditableArticleCardSchema,
                articleFormActions.updateForm({ title: 'New title' })
            )
        ).toEqual({
            form: { title: 'New title', subtitle: 'Subtitle' },
        });
    });

    test('test set validate errors', () => {
        const state: DeepPartial<EditableArticleCardSchema> = {};

        expect(
            articleFormReducer(
                state as EditableArticleCardSchema,
                articleFormActions.setValidateErrors([
                    ValidateArticleError.NO_TITLE,
                ])
            )
        ).toEqual({
            validateErrors: [ValidateArticleError.NO_TITLE],
        });
    });

    test('test clear validate errors', () => {
        const state: DeepPartial<EditableArticleCardSchema> = {
            validateErrors: [ValidateArticleError.NO_TITLE],
        };

        expect(
            articleFormReducer(
                state as EditableArticleCardSchema,
                articleFormActions.setValidateErrors(undefined)
            )
        ).toEqual({
            validateErrors: undefined,
        });
    });
});
