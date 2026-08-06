import { ArticleBlock, ArticleType } from '@/entities/Article';

export enum ValidateArticleError {
    NO_DATA = 'NO_DATA',
    NO_TITLE = 'NO_TITLE',
    NO_SUBTITLE = 'NO_SUBTITLE',
    NO_IMAGE = 'NO_IMAGE',
    NO_TYPE = 'NO_TYPE',
    SERVER_ERROR = 'SERVER_ERROR',
}

// Shaped after the raw json-server record (userId, no expanded `user`), not the
// `Article` read-model — `getArticle` intentionally skips `_expand=user` so the
// same object can be sent straight back on PUT without a shape mismatch.
export interface ArticleFormData {
    id?: string;
    title?: string;
    subtitle?: string;
    img?: string;
    type?: ArticleType[];
    userId?: string;
    views?: number;
    createdAt?: string;
    blocks?: ArticleBlock[];
}

export interface EditableArticleCardSchema {
    form?: ArticleFormData;
    validateErrors?: ValidateArticleError[];
}
