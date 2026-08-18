import { RegisterValidateError } from '../types/registerSchema';

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const USERNAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const PASSWORD_MIN_LENGTH = 6;

export const validateRegisterData = (
    username: string,
    password: string,
    passwordRepeat: string,
): RegisterValidateError[] => {
    const errors: RegisterValidateError[] = [];

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
        errors.push(RegisterValidateError.USERNAME_TOO_SHORT);
    } else if (!USERNAME_PATTERN.test(username)) {
        errors.push(RegisterValidateError.USERNAME_INVALID_CHARS);
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        errors.push(RegisterValidateError.PASSWORD_TOO_SHORT);
    }

    if (password !== passwordRepeat) {
        errors.push(RegisterValidateError.PASSWORDS_DO_NOT_MATCH);
    }

    return errors;
};
