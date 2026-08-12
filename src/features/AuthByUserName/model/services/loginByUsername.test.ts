import { loginByUsername } from './loginByUsername';
import { TestAsyncThunk } from '@/shared/lib/tests/TestAsyncThunk';
import { userActions } from '@/entities/User';
import { TOKEN_LOCALSTORAGE_KEY, USER_LOCALSTORAGE_KEY } from '@/shared/const/localStorage';

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

    test('ответ без токена считается ошибкой', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        // Пользователь есть, токена нет — сессию строить не на чем.
        thunk.api.post.mockReturnValue(
            Promise.resolve({ data: { user: { username: '123', id: '1' } } }),
        );
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe('login error');
        expect(localStorage.getItem(TOKEN_LOCALSTORAGE_KEY)).toBeNull();
    });

    test('error login', async () => {
        const thunk = new TestAsyncThunk(loginByUsername);
        thunk.api.post.mockReturnValue(Promise.resolve({ status: 403 }));
        const result = await thunk.callThunk({ username: '123', password: '123' });

        expect(thunk.dispatch).toHaveBeenCalledTimes(2);
        expect(thunk.api.post).toHaveBeenCalled();
        expect(result.meta.requestStatus).toBe('rejected');
        expect(result.payload).toBe('login error');
    });
});
