import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button/Button';
import cls from './LoginForm.module.scss';
import { Input } from '@/shared/ui/Input/Input';
import { FormEvent, memo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { loginActions, loginReducer } from '../../model/slice/loginSlice';
import { Text, TextTheme } from '@/shared/ui/Text/Text';
import {
    getLoginError,
    getLoginIsLoading,
    getLoginPassword,
    getLoginUsername,
} from '../../model/selectors/getLoginFunctions';
import {
    DynamicModuleLoader,
    ReducersList,
} from '@/shared/lib/components/DynamicModuleLoader';
import { loginByUsername } from '../../model/services/loginByUsername';
import { classNames } from '@/shared/lib/classNames/classNames';
import { useAppDispatch } from '@/shared/lib/hooks/useAppDispatch';
import { AuthErrorCode } from '../../model/types/authError';

export interface LoginFormProps {
    onSuccess?: () => void;
}

const initialReducers: ReducersList = {
    loginForm: loginReducer,
};

const LoginForm = memo(({ onSuccess }: LoginFormProps) => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const username = useSelector(getLoginUsername);
    const password = useSelector(getLoginPassword);
    const isLoading = useSelector(getLoginIsLoading);
    const error = useSelector(getLoginError);

    // TOO_MANY_ATTEMPTS — единственный код, который login-форме есть смысл
    // показывать отдельно: остальное (неверный пароль, сетевой сбой) для
    // вошедшего гостя выглядит одинаково — «попробуйте ещё раз».
    const errorText = error === AuthErrorCode.TOO_MANY_ATTEMPTS
        ? t('login.tooManyAttempts')
        : t('login.error');

    const onChangeUsername = useCallback(
        (value: string) => {
            dispatch(loginActions.setUsername(value));
        },
        [dispatch]
    );
    const onChangePassword = useCallback(
        (value: string) => {
            dispatch(loginActions.setPassword(value));
        },
        [dispatch]
    );

    const onLoginClick = useCallback(async () => {
        const result = await dispatch(loginByUsername({ username, password }));
        if (result.meta.requestStatus === 'fulfilled' && onSuccess) onSuccess();
    }, [dispatch, username, password, onSuccess]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onLoginClick();
    };

    return (
        <DynamicModuleLoader reducers={initialReducers} removeAfterUnmount>
            <form
                className={classNames(cls.LoginForm, {}, [])}
                onSubmit={onSubmit}
            >
                <Text title={t('login.authorization')} />
                {Boolean(error) && (
                    <Text theme={TextTheme.ERROR} text={errorText} />
                )}
                <Input
                    autofocus
                    type='text'
                    className={cls.input}
                    placeholder={t('login.username')}
                    onChange={onChangeUsername}
                    value={username}
                />

                <Input
                    type='password'
                    className={cls.input}
                    placeholder={t('login.password')}
                    onChange={onChangePassword}
                    value={password}
                />
                <Button
                    className={cls.loginBtn}
                    type='submit'
                    disabled={isLoading}
                >
                    {t('login.submit')}
                </Button>
            </form>
        </DynamicModuleLoader>
    );
});

export default LoginForm;
