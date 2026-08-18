/**
 * Общие коды ошибок для /login и /register — оба живут в этой фиче и должны
 * показывать пользователю разное сообщение под разные причины отказа, а не
 * один и тот же общий текст.
 */
export enum AuthErrorCode {
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    USERNAME_TAKEN = 'USERNAME_TAKEN',
    TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
    UNKNOWN = 'UNKNOWN',
}
