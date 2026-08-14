import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { Card, CardTheme } from '@/shared/ui/Card/Card';
import { Text } from '@/shared/ui/Text/Text';
import { HStack } from '@/shared/ui/Stack';
import cls from './AuthRequiredNotice.module.scss';

interface AuthRequiredNoticeProps {
    className?: string;
    /** Что именно требует входа — «оставить комментарий», «оценить статью». */
    text: string;
    onLogin: () => void;
}

/**
 * Подсказка на месте действия, требующего входа.
 *
 * Встроенный блок, а не модалка: он занимает место того элемента, которого
 * гость не видит (формы комментария, блока оценки), и сразу объясняет, почему
 * его нет. Модалка была бы уместна, если бы гость чего-то не мог сделать
 * по клику, но здесь элемента просто нет.
 *
 * Про авторизацию ничего не знает: лежит в shared, откуда импорт в entities
 * запрещён правилами FSD. Что делает кнопка — решает тот, кто показывает.
 */
export const AuthRequiredNotice = memo((props: AuthRequiredNoticeProps) => {
    const { className = '', text, onLogin } = props;
    const { t } = useTranslation();

    return (
        <Card
            theme={CardTheme.OUTLINED}
            max
            className={classNames(cls.AuthRequiredNotice, {}, [className])}
        >
            <HStack gap='16' justify='between' align='center' max>
                <Text text={text} />
                <Button
                    theme={ButtonTheme.OUTLINE}
                    onClick={onLogin}
                    data-testid='AuthRequiredNotice.LoginButton'
                >
                    {t('navbar.login')}
                </Button>
            </HStack>
        </Card>
    );
});
