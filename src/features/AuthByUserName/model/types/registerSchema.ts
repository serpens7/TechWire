/** Ограничения зеркалят server/src/auth/dto/register.dto.ts. */
export enum RegisterValidateError {
    USERNAME_TOO_SHORT = 'USERNAME_TOO_SHORT',
    USERNAME_INVALID_CHARS = 'USERNAME_INVALID_CHARS',
    PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
    PASSWORDS_DO_NOT_MATCH = 'PASSWORDS_DO_NOT_MATCH',
}
