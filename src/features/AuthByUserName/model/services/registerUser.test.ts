import { registerUser } from './registerUser';
import { TestAsyncThunk } from '@/shared/lib/tests/TestAsyncThunk';
import { userActions } from '@/entities/User';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';
import { AuthErrorCode } from '../types/authError';

/** eslint требует, чтобы отклонённый промис нёс Error, а не голый объект. */
const axiosErrorLike = (status: number) => Object.assign(new Error('request failed'), {
    response: { status },
});

describe('registerUser.test', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('success register', async () => {
        const userValue = { username: 'new_user', id: '1' };
        const token = 'jwt.token.value';

        const thunk = new TestAsyncThunk(registerUser);
        thunk.api.post.mockReturnValue(Promise.resolve({ data: { user: userValue, token } }));
        const result = await thunk.callThunk({ username: 'new_user', password: 'password123' });

        expect(thunk.dispatch).toHaveBeenCalledWith(userActions.setAuthData(userValue));
        expect(thunk.api.post).toHaveBeenCalledWith('/register', {
            username: 'new_user',
            password: 'password123',
        });
        expect(result.meta.requestStatus).toBe('fulfilled');
        expect(result.payload).toEqual(userValue);
    });

    test('токен и пользователь сохраняются в localStorage', async () => {
        const userValue = { username: 'new_user', id: '1' };
        const token = 'jwt.token.value';

        const thunk = new TestAsyncThunk(registerUser);
        thunk.api.post.mockReturnValue(Promise.resolve({ data: { user: userValue, token } }));
        await thunk.callThunk({ username: 'new_user', password: 'password123' });

        expect(localStorage.getItem(TOKEN_LOCALSTORAGE_KEY)).toBe(token);
        expect(JSON.parse(localStorage.getItem(USER_LOCALSTORAGE_KEY) as string)).toEqual(userValue);
    });

    test('ответ без токена считается неизвестной ошибкой', async () => {
        const thunk = new TestAsyncThunk(registerUser);
        thunk.api.post.mockReturnValue(
            Promise.resolve({ data: { user: { username: 'new_user', id: '1' } } }),
        );
        const result = await thunk.callThunk({ username: 'new_user', password: 'password123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.UNKNOWN);
        expect(localStorage.getItem(TOKEN_LOCALSTORAGE_KEY)).toBeNull();
    });

    test('занятый логин — код USERNAME_TAKEN', async () => {
        const thunk = new TestAsyncThunk(registerUser);
        thunk.api.post.mockReturnValue(Promise.reject(axiosErrorLike(409)));
        const result = await thunk.callThunk({ username: 'admin', password: 'password123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.USERNAME_TAKEN);
    });

    test('слишком много попыток — код TOO_MANY_ATTEMPTS', async () => {
        const thunk = new TestAsyncThunk(registerUser);
        thunk.api.post.mockReturnValue(Promise.reject(axiosErrorLike(429)));
        const result = await thunk.callThunk({ username: 'new_user', password: 'password123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe(AuthErrorCode.TOO_MANY_ATTEMPTS);
    });
});
