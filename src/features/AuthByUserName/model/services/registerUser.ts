import { createAsyncThunk } from '@reduxjs/toolkit';
import { User, userActions } from '@/entities/User';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';
import { ThunkConfig } from '@/app/providers/StoreProvider';
import { getAuthErrorCode } from '../lib/getAuthErrorCode';
import { AuthErrorCode } from '../types/authError';

interface RegisterUserProps {
    username: string;
    password: string;
}

/** Ответ /register такой же, как у /login: сразу пользователь + токен. */
interface RegisterResponse {
    user: User;
    token: string;
}

export const registerUser = createAsyncThunk<
    User,
    RegisterUserProps,
    ThunkConfig<AuthErrorCode>
>('auth/registerUser', async (registerData, thunkAPI) => {
    try {
        const response = await thunkAPI.extra.api.post<RegisterResponse>(
            '/register',
            registerData,
        );
        const { user, token } = response.data ?? {};

        if (!user || !token) {
            throw new Error('Некорректный ответ /register');
        }

        localStorage.setItem(TOKEN_LOCALSTORAGE_KEY, token);
        localStorage.setItem(USER_LOCALSTORAGE_KEY, JSON.stringify(user));
        thunkAPI.dispatch(userActions.setAuthData(user));

        return user;
    } catch (e) {
        return thunkAPI.rejectWithValue(getAuthErrorCode(e));
    }
});
