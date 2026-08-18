import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Button, ButtonSize, ButtonTheme } from '@/shared/ui/Button/Button';
import { Text, TextAlign } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import cls from './PageError.module.scss';

interface PageErrorProps {
    className?: string;
}

const reloadPage = () => {
    window.location.reload();
};

/**
 * Заглушка на случай упавшего рендера — показывается из ErrorBoundary,
 * который обёрнут вокруг всего приложения. Здесь нет ни шапки, ни темы
 * (падение могло случиться и в них), поэтому вёрстка самодостаточна:
 * занимает весь экран и центрирует содержимое сама.
 */
export const PageError = ({ className = '' }: PageErrorProps) => {
    const { t } = useTranslation();

    return (
        <VStack
            gap='16'
            align='center'
            justify='center'
            className={classNames(cls.PageError, {}, [className])}
        >
            <Text
                title={t('error.occured')}
                text={t('error.reloadHint')}
                align={TextAlign.CENTER}
            />
            <Button
                theme={ButtonTheme.OUTLINE}
                size={ButtonSize.L}
                onClick={reloadPage}
            >
                {t('error.reload')}
            </Button>
        </VStack>
    );
};
