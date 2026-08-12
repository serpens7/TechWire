import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Page } from '@/widgets/Page';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { Button, ButtonSize, ButtonTheme } from '@/shared/ui/Button/Button';
import { Text, TextAlign, TextSize } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import { getRouteMain } from '@/shared/const/router';
import cls from './NotFoundPage.module.scss';

interface NotFoundPageProps {
    className?: string;
}

export const NotFoundPage = ({ className = '' }: NotFoundPageProps) => {
    const { t } = useTranslation();

    return (
        <Page className={classNames(cls.NotFoundPage, {}, [className])}>
            <VStack gap='16' align='center' justify='center' max className={cls.content}>
                {/* Обычный div, а не Text: это декоративный элемент, и у Text
                    размеры зашиты в его собственные модификаторы — перебивать
                    их снаружи пришлось бы борьбой со специфичностью. */}
                <div className={cls.code} aria-hidden='true'>
                    404
                </div>
                <Text
                    title={t('notFound.title')}
                    text={t('notFound.description')}
                    size={TextSize.L}
                    align={TextAlign.CENTER}
                />
                <AppLink to={getRouteMain()}>
                    <Button theme={ButtonTheme.OUTLINE} size={ButtonSize.L}>
                        {t('notFound.goHome')}
                    </Button>
                </AppLink>
            </VStack>
        </Page>
    );
};
