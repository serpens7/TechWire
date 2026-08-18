import { loginByUsername } from './loginByUsername';
import { TestAsyncThunk } from '@/shared/lib/tests/TestAsyncThunk';
import { userActions } from '@/entities/User';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';
import { AuthErrorCode } from '../types/authError';

/** eslint требует, чтобы отклонённый промис нёс Error, а не голый объект. */
const axiosErrorLike = (status: number) => Object.assign(new Error('request failed'), {
    response: { status },
});

describe('loginByUsername.test', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('success login', async () => {
        const userValue = { username: '123', id: '1' };
        const token = 'jwt.token.value';

        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.resolve({ data: { user: userValue, token } }));
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(thunk.dispatch).toHaveBeenCalledWith(userActions.setAuthData(userValue));
        expect(thunk.dispatch).toHaveBeenCalledTimes(3);
        expect(thunk.api.post).toHaveBeenCalled();
        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toEqual(userValue);
    });

    test('токен и пользователь сохраняются в localStorage', async () => {
        const userValue = { username: '123', id: '1' };
        const token = 'jwt.token.value';

        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.resolve({ data: { user: userValue, token } }));
        await thunk.callThunk({ username: '123', password: '123' });

        expect(localStorage.getItem(TOKEN_LOCALSTORAGE_KEY)).toBe(token);
        expect(JSON.parse(localStorage.getItem(USER_LOCALSTORAGE_KEY) as string)).toEqual(userValue);
    });

    test('ответ без токена считается неизвестной ошибкой', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        // Пользователь есть, токена нет — сессию строить не на чем.
        thunk.api.post.mockReturnValue(
            Promise.resolve({ data: { user: { username: '123', id: '1' } } }),
        );
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.UNKNOWN);
        expect(localStorage.getItem(TOKEN_LOCALSTORAGE_KEY)).toBeNull();
    });

    test('неверный пароль — код INVALID_CREDENTIALS', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.reject(axiosErrorLike(401)));
        const result = await thunk.callThunk({ username: '123', password: 'wrong' });

        expect(thunk.api.post).toHaveBeenCalled();
        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.INVALID_CREDENTIALS);
    });

    test('слишком много попыток — код TOO_MANY_ATTEMPTS', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.reject(axiosErrorLike(429)));
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.TOO_MANY_ATTEMPTS);
    });

    test('ответ без HTTP-статуса — неизвестная ошибка', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.resolve({ status: 403 }));
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(thunk.dispatch).toHaveBeenCalledTimes(2);
        expect(thunk.api.post).toHaveBeenCalled();
        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.UNKNOWN);
    });
});
