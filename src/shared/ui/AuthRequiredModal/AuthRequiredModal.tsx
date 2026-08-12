import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Modal } from '@/shared/ui/Modal/Modal';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { HStack, VStack } from '@/shared/ui/Stack';
import cls from './AuthRequiredModal.module.scss';

interface AuthRequiredModalProps {
    className?: string;
    isOpen: boolean;
    onClose: () => void;
    /** Обычно — открыть форму входа. */
    onLogin: () => void;
}

/**
 * Предупреждение о том, что действие требует входа.
 *
 * Намеренно ничего не знает про авторизацию и стор: лежит в shared, откуда
 * импорт в entities запрещён правилами FSD. Кто показывает — тот и решает,
 * что делает кнопка «Войти».
 */
export const AuthRequiredModal = memo((props: AuthRequiredModalProps) => {
    const { className = '', isOpen, onClose, onLogin } = props;
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} lazy>
            <VStack
                gap='16'
                max
                className={classNames(cls.AuthRequiredModal, {}, [className])}
            >
                <Text
                    title={t('auth.requiredTitle')}
                    text={t('auth.requiredText')}
                    size={TextSize.L}
                />
                <HStack gap='8' justify='end' max>
                    <Button theme={ButtonTheme.OUTLINE} onClick={onClose}>
                        {t('auth.later')}
                    </Button>
                    <Button
                        theme={ButtonTheme.BACKGROUND_INVERTED}
                        onClick={onLogin}
                        data-testid='AuthRequiredModal.LoginButton'
                    >
                        {t('navbar.login')}
                    </Button>
                </HStack>
            </VStack>
        </Modal>
    );
});
