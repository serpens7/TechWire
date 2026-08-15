import { useTranslation } from 'react-i18next';
import { FormEvent, memo, useCallback, useState } from 'react';
import { Button } from '@/shared/ui/Button/Button';
import { Input } from '@/shared/ui/Input/Input';
import { Text, TextTheme } from '@/shared/ui/Text/Text';
import { classNames } from '@/shared/lib/classNames/classNames';
import { useAppDispatch } from '@/shared/lib/hooks/useAppDispatch';
import { registerUser } from '../../model/services/registerUser';
import { validateRegisterData } from '../../model/services/validateRegisterData';
import { RegisterValidateError } from '../../model/types/registerSchema';
import cls from './RegisterForm.module.scss';

export interface RegisterFormProps {
    onSuccess?: () => void;
}

/**
 * Состояние формы держим локально, не в Redux: в отличие от LoginForm, здесь
 * нечего переиспользовать между заходами в модалку — регистрация происходит
 * один раз, а DynamicModuleLoader и отдельный слайс были бы избыточны.
 */
const RegisterForm = memo(({ onSuccess }: RegisterFormProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordRepeat, setPasswordRepeat] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>();
    const [validationErrors, setValidationErrors] = useState<RegisterValidateError[]>([]);

    const validateErrorTranslates: Record<RegisterValidateError, string> = {
        [RegisterValidateError.USERNAME_TOO_SHORT]: t('register.errors.usernameLength'),
        [RegisterValidateError.USERNAME_INVALID_CHARS]: t('register.errors.usernameChars'),
        [RegisterValidateError.PASSWORD_TOO_SHORT]: t('register.errors.passwordLength'),
        [RegisterValidateError.PASSWORDS_DO_NOT_MATCH]: t('register.errors.passwordsMismatch'),
    };

    const onSubmit = useCallback(
        async (e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            const errors = validateRegisterData(username, password, passwordRepeat);
            setValidationErrors(errors);

            if (errors.length) {
                return;
            }

            setError(undefined);
            setIsLoading(true);
            const result = await dispatch(registerUser({ username, password }));
            setIsLoading(false);

            if (result.meta.requestStatus === 'fulfilled') {
                onSuccess?.();
            } else {
                setError(t('register.error'));
            }
        },
        [dispatch, username, password, passwordRepeat, onSuccess, t],
    );

    return (
        <form className={classNames(cls.RegisterForm, {}, [])} onSubmit={onSubmit}>
            <Text title={t('register.title')} />
            {Boolean(error) && <Text theme={TextTheme.ERROR} text={error} />}
            {validationErrors.map((err) => (
                <Text key={err} theme={TextTheme.ERROR} text={validateErrorTranslates[err]} />
            ))}
            <Input
                autofocus
                type='text'
                className={cls.input}
                placeholder={t('register.username')}
                onChange={setUsername}
                value={username}
            />
            <Input
                type='password'
                className={cls.input}
                placeholder={t('register.password')}
                onChange={setPassword}
                value={password}
            />
            <Input
                type='password'
                className={cls.input}
                placeholder={t('register.passwordRepeat')}
                onChange={setPasswordRepeat}
                value={passwordRepeat}
            />
            <Button className={cls.registerBtn} type='submit' disabled={isLoading}>
                {t('register.submit')}
            </Button>
        </form>
    );
});

export default RegisterForm;
