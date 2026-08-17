import { ArticleDetailsSchema } from "@/entities/Article";
import { UserSchema } from "@/entities/User";
import { LoginSchema } from "@/features/AuthByUserName";
import { ProfileSchema } from "@/features/editableProfileCard";
import { EditableArticleCardSchema } from "@/features/editableArticleCard";
import { ArticlesPageSchema } from "@/pages/ArticlesPage";
import { Dispatch, EnhancedStore, Reducer, ReducersMapObject, UnknownAction } from "@reduxjs/toolkit";
import { AxiosInstance } from "axios";
import { NavigateOptions, To } from "react-router-dom";
import { rtkApi } from "@/shared/api/rtkApi";

export interface CounterSchema {
    value: number;
}

export interface StateSchema {
    counter: CounterSchema;
    user: UserSchema;
    profile?: ProfileSchema;
    loginForm?: LoginSchema;
    articleDetails?: ArticleDetailsSchema;
    articlesPage?: ArticlesPageSchema;
    articleForm?: EditableArticleCardSchema;

    [rtkApi.reducerPath]: ReturnType<typeof rtkApi.reducer>;
}

export type StateSchemaKey = keyof StateSchema;

export interface ReducerManager {
    getReducerMap: () => ReducersMapObject<StateSchema>;
    reduce: (state: StateSchema, action: UnknownAction) => StateSchema;
    add: (key: StateSchemaKey, reducer: Reducer) => void;
    remove: (key: StateSchemaKey) => void;
    getMountedReducers: () => OptionalRecord<StateSchemaKey, boolean>;
}


export interface ReduxStoreWithManager extends EnhancedStore<StateSchema> {
    reducerManager: ReducerManager;
}

export interface ThunkExtraArg {
    api: AxiosInstance;
    navigate?: (to: To, options?: NavigateOptions) => void;
}

export type ThunkConfig<T> = {
    rejectValue: T;
    extra: ThunkExtraArg;
    dispatch?: Dispatch;
    state: StateSchema;
}

