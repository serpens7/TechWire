import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserSchema } from '../types/user';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';

const initialState: UserSchema = {
    inited: false,
    isLoginModalOpen: false,
};

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setAuthData: (state, action: PayloadAction<User>) => {
            state.authData = action.payload;
        },
        /**
         * Восстановление сессии при старте приложения.
         *
         * Кэш пользователя нужен, чтобы шапка отрисовалась мгновенно, но сам по
         * себе он ничего не значит: без токена сессии нет, поэтому нужны оба
         * ключа. Настоящая проверка всё равно происходит на сервере — если
         * токен протух, перехватчик ответа в api.ts вычистит хранилище.
         */
        initAuthData: (state) => {
            const token = localStorage.getItem(TOKEN_LOCALSTORAGE_KEY);
            const user = localStorage.getItem(USER_LOCALSTORAGE_KEY);

            if (token && user) {
                state.authData = JSON.parse(user);
            }

            state.inited = true;
        },
        logout: (state) => {
            state.authData = undefined;
            localStorage.removeItem(TOKEN_LOCALSTORAGE_KEY);
            localStorage.removeItem(USER_LOCALSTORAGE_KEY);
        },
        openLoginModal: (state) => {
            state.isLoginModalOpen = true;
        },
        closeLoginModal: (state) => {
            state.isLoginModalOpen = false;
        },
    },
});

export const { actions: userActions } = userSlice;
export const { reducer: userReducer } = userSlice;
