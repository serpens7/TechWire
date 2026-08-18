import { AuthErrorCode } from '../types/authError';

const STATUS_TO_CODE: Partial<Record<number, AuthErrorCode>> = {
    401: AuthErrorCode.INVALID_CREDENTIALS,
    409: AuthErrorCode.USERNAME_TAKEN,
    429: AuthErrorCode.TOO_MANY_ATTEMPTS,
};

/**
 * Дак-тайпинг вместо axios.isAxiosError — тем же способом протухший токен
 * узнаёт перехватчик ответа в shared/api/api.ts (`error?.response?.status`).
 * Ошибка без HTTP-статуса (например, сеть недоступна, или ответ /login без
 * токена — loginByUsername сам бросает Error в этом случае) считается
 * неизвестной.
 */
export const getAuthErrorCode = (error: unknown): AuthErrorCode => {
    const status = (error as { response?: { status?: number } } | undefined)?.response?.status;

    if (status !== undefined && STATUS_TO_CODE[status]) {
        return STATUS_TO_CODE[status] as AuthErrorCode;
    }

    return AuthErrorCode.UNKNOWN;
};
