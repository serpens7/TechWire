import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    ArticleFormData,
    EditableArticleCardSchema,
    ValidateArticleError,
} from '../types/editableArticleCardSchema';

const initialState: EditableArticleCardSchema = {
    form: undefined,
    validateErrors: undefined,
};

export const articleFormSlice = createSlice({
    name: 'articleForm',
    initialState,
    reducers: {
        initForm: (state, action: PayloadAction<ArticleFormData | undefined>) => {
            state.form = action.payload;
        },
        updateForm: (state, action: PayloadAction<Partial<ArticleFormData>>) => {
            state.form = {
                ...state.form,
                ...action.payload,
            };
        },
        setValidateErrors: (state, action: PayloadAction<ValidateArticleError[] | undefined>) => {
            state.validateErrors = action.payload;
        },
    },
});

export const { actions: articleFormActions } = articleFormSlice;
export const { reducer: articleFormReducer } = articleFormSlice;
