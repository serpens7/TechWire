import { Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import cls from './LoginModal.module.scss';
import { LoginFormAsync } from '../LoginForm/LoginForm.async';
import { RegisterFormAsync } from '../RegisterForm/RegisterForm.async';

interface LoginModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
}

type AuthMode = 'login' | 'register';

export const LoginModal = ({
    className = '',
    isOpen,
    onClose,
}: LoginModalProps) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<AuthMode>('login');

    const onSuccess = useCallback(() => {
        setMode('login');
        onClose();
    }, [onClose]);

    const toggleMode = useCallback(() => {
        setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    }, []);

    return (
        <Modal
            className={classNames(cls.LoginModal, {}, [className])}
            isOpen={isOpen}
            onClose={onClose}
            lazy
        >
            <Suspense fallback='Loading...'>
                {mode === 'login' ? (
                    <LoginFormAsync onSuccess={onSuccess} />
                ) : (
                    <RegisterFormAsync onSuccess={onSuccess} />
                )}
            </Suspense>
            <Button
                theme={ButtonTheme.CLEAR}
                className={cls.switchModeBtn}
                onClick={toggleMode}
            >
                {mode === 'login' ? t('login.goToRegister') : t('login.goToLogin')}
            </Button>
        </Modal>
    );
};
