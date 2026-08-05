import { StateSchema } from '@/app/providers/StoreProvider';

export const getArticleForm = (state: StateSchema) => state.articleForm?.form;

export const getArticleFormValidateErrors = (state: StateSchema) =>
    state.articleForm?.validateErrors;
