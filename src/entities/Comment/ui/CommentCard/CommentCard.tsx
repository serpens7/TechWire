import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { Text } from '@/shared/ui/Text/Text';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import cls from './CommentCard.module.scss';
import { Comment } from '../../model/types/comment';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { getRouteAuthor } from '@/shared/const/router';
import { VStack } from '@/shared/ui/Stack';

interface CommentCardProps {
    className?: string;
    comment?: Comment;
    isLoading?: boolean;
    /** Ответ на этот комментарий — отступ и без собственной кнопки «Ответить». */
    isReply?: boolean;
    onReply?: (comment: Comment) => void;
}

export const CommentCard = (props: CommentCardProps) => {
    const {
        className = '', comment, isLoading, isReply, onReply,
    } = props;
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div
                className={classNames(cls.CommentCard, {}, [
                    className,
                    cls.loading,
                ])}
            >
                <div className={cls.header}>
                    <Skeleton width={30} height={30} border='50%' />
                    <Skeleton
                        height={16}
                        width={100}
                        className={cls.username}
                    />
                </div>
                <Skeleton width='100%' height={50} />
            </div>
        );
    }
    if (!comment) return null;

    return (
        <VStack
            gap='8'
            max
            className={classNames(cls.CommentCard, { [cls.reply]: Boolean(isReply) }, [
                className,
            ])}
        >
            <AppLink
                to={getRouteAuthor(comment.user.id)}
                className={cls.header}
            >
                {comment.user.avatar ? (
                    <Avatar size={30} src={comment.user.avatar} />
                ) : null}
                <Text className={cls.username} title={comment.user.username} />
            </AppLink>
            <Text
                className={cls.text}
                text={
                    comment.replyToUser
                        ? `@${comment.replyToUser.username} ${comment.text}`
                        : comment.text
                }
            />
            {onReply && (
                <Button
                    theme={ButtonTheme.CLEAR}
                    className={cls.replyBtn}
                    onClick={() => onReply(comment)}
                >
                    {t('comments.reply')}
                </Button>
            )}
        </VStack>
    );
};
