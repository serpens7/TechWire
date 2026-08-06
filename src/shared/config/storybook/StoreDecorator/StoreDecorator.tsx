import { StateSchema, StoreProvider } from '@/app/providers/StoreProvider';
import { Decorator } from '@storybook/react';
import { Action, ReducersMapObject } from '@reduxjs/toolkit';
import { loginReducer } from '@/features/AuthByUserName';
import { profileReducer } from '@/features/editableProfileCard';
import { articleFormReducer } from '@/features/editableArticleCard';
import { articleDetailsReducer } from '@/entities/Article';

const defaultAsyncReducers = {
    loginForm: loginReducer,
    profile: profileReducer,
    articleDetails: articleDetailsReducer,
    articleForm: articleFormReducer,
};

export const StoreDecorator =
    (
        state: DeepPartial<StateSchema>,
        asyncReducers?: DeepPartial<ReducersMapObject<StateSchema>>
    ): Decorator =>
        (StoryComponent) => (
            <StoreProvider
                initialState={state}
                asyncReducers={
                     { ...defaultAsyncReducers, ...asyncReducers } as DeepPartial<
                    ReducersMapObject<StateSchema, Action<any>>
                >
                }
            >
                <StoryComponent />
            </StoreProvider>
        );
