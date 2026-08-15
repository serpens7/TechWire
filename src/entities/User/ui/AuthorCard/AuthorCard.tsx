import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Card } from '@/shared/ui/Card/Card';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { HStack, VStack } from '@/shared/ui/Stack';
import { Author } from '../../model/types/author';
import cls from './AuthorCard.module.scss';

interface AuthorCardProps {
    className?: string;
    author?: Author;
    isLoading?: boolean;
}

export const AuthorCard = memo((props: AuthorCardProps) => {
    const { className = '', author, isLoading } = props;
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <Card max className={classNames(cls.AuthorCard, {}, [className])}>
                <HStack gap='16' max>
                    <Skeleton width={80} height={80} border='50%' />
                    <VStack gap='8' max>
                        <Skeleton width={150} height={24} />
                        <Skeleton width='60%' height={16} />
                        <Skeleton width={100} height={16} />
                    </VStack>
                </HStack>
            </Card>
        );
    }

    if (!author) return null;

    const displayName = [author.first, author.lastname].filter(Boolean).join(' ');
    const hasAge = typeof author.age === 'number';
    const hasFacts = hasAge || Boolean(author.city);

    return (
        <Card max className={classNames(cls.AuthorCard, {}, [className])}>
            <HStack gap='16' max align='start'>
                <Avatar size={80} src={author.avatar} />
                <VStack gap='8' max>
                    <Text title={author.username} size={TextSize.L} />
                    {Boolean(displayName) && <Text text={displayName} />}
                    {Boolean(author.status) && (
                        <Text text={`«${author.status}»`} className={cls.status} />
                    )}
                    {hasFacts && (
                        <HStack gap='8' className={cls.facts}>
                            {hasAge && (
                                <Text text={t('author.age', { count: author.age })} />
                            )}
                            {hasAge && Boolean(author.city) && <Text text='·' />}
                            {Boolean(author.city) && <Text text={author.city} />}
                        </HStack>
                    )}
                    <Text
                        text={t('author.articlesCount', { count: author.articlesCount })}
                        className={cls.articlesCount}
                    />
                </VStack>
            </HStack>
        </Card>
    );
});
