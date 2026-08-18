import { StateSchema } from '@/app/providers/StoreProvider';
import { getLoginError, getLoginIsLoading, getLoginPassword, getLoginUsername } from './getLoginFunctions';
import { AuthErrorCode } from '../types/authError';

describe('login selectors', () => {
    const state: DeepPartial<StateSchema> = {
        loginForm: {
            username: 'admin',
            password: '123123',
            isLoading: true,
            error: AuthErrorCode.INVALID_CREDENTIALS,
        },
    };

    test('getLoginUsername', () => {
        expect(
            getLoginUsername(state as StateSchema)
        ).toEqual('admin');
    });

    test('getLoginPassword', () => {
        expect(
            getLoginPassword(state as StateSchema)
        ).toEqual('123123');
    });

    test('getLoginIsLoading', () => {
        expect(
            getLoginIsLoading(state as StateSchema)
        ).toEqual(true);
    });

    test('getLoginError', () => {
        expect(
            getLoginError(state as StateSchema)
        ).toEqual(AuthErrorCode.INVALID_CREDENTIALS);
    });

    test('should work with empty state', () => {
        const state: DeepPartial<StateSchema> = {};

        expect(
            getLoginUsername(state as StateSchema)
        ).toEqual('');

        expect(
            getLoginPassword(state as StateSchema)
        ).toEqual('');

        expect(
            getLoginIsLoading(state as StateSchema)
        ).toEqual(false);

        expect(
            getLoginError(state as StateSchema)
        ).toEqual(undefined);
    });
});