import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Text } from '@/shared/ui/Text/Text';
import { Code } from '@/shared/ui/Code/Code';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { HStack } from '@/shared/ui/Stack';
import { AuthRequiredModal } from '@/shared/ui/AuthRequiredModal/AuthRequiredModal';
import { getRouteArticleDetails } from '@/shared/const/router';
import { useHighlights } from '@/entities/Article';
import { useAuthGate } from '@/entities/User';
import cls from './SnippetOfTheDay.module.scss';

interface SnippetOfTheDayProps {
    className?: string;
}

const SNIPPET_PATH = '~/techwire/snippet.js';

const TitleBar = () => (
    <div className={cls.titleBar}>
        <div className={cls.dots}>
            <span className={cls.dotRed} />
            <span className={cls.dotAmber} />
            <span className={cls.dotGreen} />
        </div>
        <Text text={SNIPPET_PATH} className={cls.path} />
    </div>
);

const SnippetOfTheDaySkeleton = () => (
    <div className={cls.window}>
        <TitleBar />
        <div className={cls.body}>
            <Skeleton width='100%' height={140} />
        </div>
        <div className={cls.footer}>
            <Skeleton width={220} height={16} />
        </div>
    </div>
);

export const SnippetOfTheDay = memo((props: SnippetOfTheDayProps) => {
    const { className = '' } = props;
    const { t } = useTranslation();
    const { data, isLoading, error } = useHighlights();
    // Выбор сниппета делает сервер. Раньше клиент забирал два десятка статей
    // целиком и выбирал сам, но после закрытия каталога такой запрос
    // незалогиненному недоступен — и отдавать статьи ради одного блока кода
    // всё равно было расточительно.
    const snippet = data?.snippetOfTheDay;
    const { guard, isPromptOpen, closePrompt, goToLogin } = useAuthGate();

    if (isLoading) {
        return (
            <div className={classNames(cls.SnippetOfTheDay, {}, [className])}>
                <Text
                    text={`> ${t('main.snippetOfTheDay')}`}
                    className={cls.eyebrow}
                />
                <SnippetOfTheDaySkeleton />
            </div>
        );
    }

    if (error || !snippet) {
        return null;
    }

    return (
        <div className={classNames(cls.SnippetOfTheDay, {}, [className])}>
            <Text
                text={`> ${t('main.snippetOfTheDay')}`}
                className={cls.eyebrow}
            />
            <div className={cls.window}>
                <TitleBar />
                <Code text={snippet.code} className={cls.code} />
                <div className={cls.footer}>
                    <Text text={t('main.fromArticle')} className={cls.fromLabel} />
                    <AppLink
                        to={getRouteArticleDetails(snippet.article.id)}
                        className={cls.articleLink}
                        onClick={guard}
                    >
                        {snippet.article.title}
                    </AppLink>
                    <HStack gap='8' className={cls.author}>
                        <Avatar size={24} src={snippet.article.user.avatar} />
                        <Text text={snippet.article.user.username} />
                    </HStack>
                </div>
            </div>
            <AuthRequiredModal
                isOpen={isPromptOpen}
                onClose={closePrompt}
                onLogin={goToLogin}
            />
        </div>
    );
});
