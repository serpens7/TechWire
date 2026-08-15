import { getAuthErrorCode } from './getAuthErrorCode';
import { AuthErrorCode } from '../types/authError';

describe('getAuthErrorCode.test', () => {
    test('401 → INVALID_CREDENTIALS', () => {
        expect(getAuthErrorCode({ response: { status: 401 } })).toBe(
            AuthErrorCode.INVALID_CREDENTIALS,
        );
    });

    test('409 → USERNAME_TAKEN', () => {
        expect(getAuthErrorCode({ response: { status: 409 } })).toBe(
            AuthErrorCode.USERNAME_TAKEN,
        );
    });

    test('429 → TOO_MANY_ATTEMPTS', () => {
        expect(getAuthErrorCode({ response: { status: 429 } })).toBe(
            AuthErrorCode.TOO_MANY_ATTEMPTS,
        );
    });

    test('неизвестный статус → UNKNOWN', () => {
        expect(getAuthErrorCode({ response: { status: 500 } })).toBe(AuthErrorCode.UNKNOWN);
    });

    test('нет ответа сервера → UNKNOWN', () => {
        expect(getAuthErrorCode(new Error('network error'))).toBe(AuthErrorCode.UNKNOWN);
        expect(getAuthErrorCode(undefined)).toBe(AuthErrorCode.UNKNOWN);
    });
});
