import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Card, CardTheme } from '@/shared/ui/Card/Card';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { AppImage } from '@/shared/ui/AppImage/AppImage';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { Icon } from '@/shared/ui/Icon/Icon';
import { HStack, VStack } from '@/shared/ui/Stack';
import EyeIcon from '@/shared/assets/icons/eye-20-20.svg';
import { AuthRequiredModal } from '@/shared/ui/AuthRequiredModal/AuthRequiredModal';
import { getRouteArticleDetails } from '@/shared/const/router';
import { useHighlights } from '@/entities/Article';
import { useAuthGate } from '@/entities/User';
import cls from './ArticleOfTheDay.module.scss';

interface ArticleOfTheDayProps {
    className?: string;
}

const ArticleOfTheDaySkeleton = () => (
    <>
        <Skeleton width={180} height={16} className={cls.eyebrowSkeleton} />
        <Card theme={CardTheme.NORMAL} max className={cls.card}>
            <div className={cls.content}>
                <div className={cls.imagePanel}>
                    <Skeleton width='100%' height='100%' />
                </div>
                <VStack gap='16' align='start' max className={cls.info}>
                    <Skeleton width='80%' height={36} />
                    <Skeleton width='60%' height={20} />
                    <Skeleton width={220} height={16} />
                    <Skeleton width={160} height={30} border='8px' />
                </VStack>
            </div>
        </Card>
    </>
);

export const ArticleOfTheDay = memo((props: ArticleOfTheDayProps) => {
    const { className = '' } = props;
    const { t } = useTranslation();
    const { data, isLoading, error } = useHighlights();
    const article = data?.articleOfTheDay;
    // Тизер виден всем, но переход к самой статье требует входа: содержимое
    // статьи в тизер не приезжает.
    const { guard, isPromptOpen, closePrompt, goToLogin } = useAuthGate();

    if (isLoading) {
        return (
            <div className={classNames(cls.ArticleOfTheDay, {}, [className])}>
                <ArticleOfTheDaySkeleton />
            </div>
        );
    }

    if (error || !article) {
        return null;
    }

    return (
        <div className={classNames(cls.ArticleOfTheDay, {}, [className])}>
            <Text
                text={`★ ${t('main.articleOfTheDay')}`}
                className={cls.eyebrow}
            />
            <Card theme={CardTheme.NORMAL} max className={cls.card}>
                <div className={cls.content}>
                    <div className={cls.imagePanel}>
                        <AppImage
                            src={article.img}
                            alt={article.title}
                            className={cls.img}
                            fallback={<Skeleton width='100%' height='100%' />}
                        />
                    </div>
                    <VStack gap='16' align='start' max className={cls.info}>
                        <Text
                            title={article.title}
                            size={TextSize.L}
                            className={cls.title}
                        />
                        <Text text={article.subtitle} className={cls.subtitle} />
                        <Text
                            text={article.type.join(' · ')}
                            className={cls.types}
                        />
                        <HStack gap='8' className={cls.meta}>
                            <Avatar size={30} src={article.user.avatar} />
                            <Text
                                text={article.user.username}
                                className={cls.username}
                            />
                            <Text text={article.createdAt} className={cls.date} />
                        </HStack>
                        <div className={cls.footer}>
                            <AppLink
                                to={getRouteArticleDetails(article.id)}
                                onClick={guard}
                            >
                                <Button theme={ButtonTheme.BACKGROUND}>
                                    {t('main.readArticle')}
                                </Button>
                            </AppLink>
                            <HStack gap='4' className={cls.views}>
                                <Icon Svg={EyeIcon} />
                                <Text text={String(article.views)} />
                            </HStack>
                        </div>
                    </VStack>
                </div>
            </Card>
            <AuthRequiredModal
                isOpen={isPromptOpen}
                onClose={closePrompt}
                onLogin={goToLogin}
            />
        </div>
    );
});
