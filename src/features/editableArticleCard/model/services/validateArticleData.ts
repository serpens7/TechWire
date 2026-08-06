import { ArticleFormData, ValidateArticleError } from '../types/editableArticleCardSchema';

export const validateArticleData = (form?: ArticleFormData) => {
    if (!form) {
        return [ValidateArticleError.NO_DATA];
    }

    const { title, subtitle, img, type } = form;

    const errors: ValidateArticleError[] = [];

    if (!title) {
        errors.push(ValidateArticleError.NO_TITLE);
    }

    if (!subtitle) {
        errors.push(ValidateArticleError.NO_SUBTITLE);
    }

    if (!img) {
        errors.push(ValidateArticleError.NO_IMAGE);
    }

    if (!type?.length) {
        errors.push(ValidateArticleError.NO_TYPE);
    }

    return errors;
};
