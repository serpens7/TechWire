import { createAsyncThunk } from '@reduxjs/toolkit';
import { User, userActions } from '@/entities/User';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';
import { ThunkConfig } from '@/app/providers/StoreProvider';
import { getAuthErrorCode } from '../lib/getAuthErrorCode';
import { AuthErrorCode } from '../types/authError';

interface LoginByUsernameProps {
    username: string;
    password: string;
}

/** Ответ /login: пользователь для отрисовки + токен для последующих запросов. */
interface LoginResponse {
    user: User;
    token: string;
}

export const loginByUsername = createAsyncThunk<
    User,
    LoginByUsernameProps,
    ThunkConfig<AuthErrorCode>
>('login/loginByUsername', async (authData, thunkAPI) => {
    try {
        const response = await thunkAPI.extra.api.post<LoginResponse>('/login', authData);
        const { user, token } = response.data ?? {};

        if (!user || !token) {
            throw new Error('Некорректный ответ /login');
        }

        localStorage.setItem(TOKEN_LOCALSTORAGE_KEY, token);
        localStorage.setItem(USER_LOCALSTORAGE_KEY, JSON.stringify(user));
        thunkAPI.dispatch(userActions.setAuthData(user));

        return user;
    } catch (e) {
        return thunkAPI.rejectWithValue(getAuthErrorCode(e));
    }
});
