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
            <Card className={classNames(cls.AuthorCard, {}, [className])}>
                <HStack gap='16' max>
                    <Skeleton width={80} height={80} border='50%' />
                    <VStack gap='8'>
                        <Skeleton width={150} height={24} />
                        <Skeleton width={100} height={16} />
                    </VStack>
                </HStack>
            </Card>
        );
    }

    if (!author) return null;

    const displayName = [author.first, author.lastname].filter(Boolean).join(' ');

    return (
        <Card className={classNames(cls.AuthorCard, {}, [className])}>
            <HStack gap='16' max>
                <Avatar size={80} src={author.avatar} />
                <VStack gap='4'>
                    <Text title={author.username} size={TextSize.L} />
                    {Boolean(displayName) && <Text text={displayName} />}
                    <Text
                        text={t('author.articlesCount', { count: author.articlesCount })}
                    />
                </VStack>
            </HStack>
        </Card>
    );
});
