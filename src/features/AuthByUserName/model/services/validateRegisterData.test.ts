import { validateRegisterData } from './validateRegisterData';
import { RegisterValidateError } from '../types/registerSchema';

describe('validateRegisterData.test', () => {
    test('валидные данные — без ошибок', () => {
        const result = validateRegisterData('valid_user', 'password123', 'password123');
        expect(result).toEqual([]);
    });

    test('короткий логин', () => {
        const result = validateRegisterData('ab', 'password123', 'password123');
        expect(result).toEqual([RegisterValidateError.USERNAME_TOO_SHORT]);
    });

    test('слишком длинный логин', () => {
        const result = validateRegisterData('a'.repeat(33), 'password123', 'password123');
        expect(result).toEqual([RegisterValidateError.USERNAME_TOO_SHORT]);
    });

    test('логин с запрещёнными символами', () => {
        const result = validateRegisterData('bad username!', 'password123', 'password123');
        expect(result).toEqual([RegisterValidateError.USERNAME_INVALID_CHARS]);
    });

    test('короткий пароль', () => {
        const result = validateRegisterData('valid_user', '123', '123');
        expect(result).toEqual([RegisterValidateError.PASSWORD_TOO_SHORT]);
    });

    test('пароли не совпадают', () => {
        const result = validateRegisterData('valid_user', 'password123', 'password124');
        expect(result).toEqual([RegisterValidateError.PASSWORDS_DO_NOT_MATCH]);
    });

    test('несколько ошибок одновременно', () => {
        const result = validateRegisterData('ab', '123', '124');
        expect(result).toEqual([
            RegisterValidateError.USERNAME_TOO_SHORT,
            RegisterValidateError.PASSWORD_TOO_SHORT,
            RegisterValidateError.PASSWORDS_DO_NOT_MATCH,
        ]);
    });
});
