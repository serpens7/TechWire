import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { Text } from '@/shared/ui/Text/Text';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import cls from './CommentCard.module.scss';
import { Comment } from '../../model/types/comment';
import { CommentForm } from '../CommentForm/CommentForm';
import { AppLink } from '@/shared/ui/AppLink/AppLink';
import { getRouteAuthor } from '@/shared/const/router';
import { HStack, VStack } from '@/shared/ui/Stack';

interface CommentCardProps {
    className?: string;
    comment?: Comment;
    isLoading?: boolean;
    /** Ответ на этот комментарий — отступ. */
    isReply?: boolean;
    /** Разрешено ли сейчас отвечать (вошедший пользователь). */
    canReply?: boolean;
    /**
     * Вызывается на любой клик «Ответить» — в том числе когда canReply=false,
     * чтобы фича могла открыть модалку входа. Открытием самой мини-формы
     * card управляет сам, когда canReply=true.
     */
    onReplyClick?: (comment: Comment) => void;
    /** Отправка мини-формы ответа под этим комментарием. */
    onSubmitReply?: (comment: Comment, text: string) => void;
    /** Комментарий принадлежит текущему пользователю — только тогда есть «Удалить». */
    isOwn?: boolean;
    onDeleteClick?: (comment: Comment) => void;
}

export const CommentCard = (props: CommentCardProps) => {
    const {
        className = '',
        comment,
        isLoading,
        isReply,
        canReply,
        onReplyClick,
        onSubmitReply,
        isOwn,
        onDeleteClick,
    } = props;
    const { t } = useTranslation();
    const [isReplying, setIsReplying] = useState(false);

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

    const handleReplyClick = () => {
        onReplyClick?.(comment);
        if (canReply) setIsReplying((prev) => !prev);
    };

    const handleSubmitReply = (text: string) => {
        onSubmitReply?.(comment, text);
        setIsReplying(false);
    };

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
            {(onReplyClick || (isOwn && onDeleteClick)) && (
                <HStack gap='16' className={cls.actions}>
                    {onReplyClick && (
                        <Button
                            theme={ButtonTheme.CLEAR}
                            className={cls.replyBtn}
                            onClick={handleReplyClick}
                        >
                            {t('comments.reply')}
                        </Button>
                    )}
                    {isOwn && onDeleteClick && (
                        <Button
                            theme={ButtonTheme.CLEAR}
                            className={cls.deleteBtn}
                            onClick={() => onDeleteClick(comment)}
                        >
                            {t('comments.delete')}
                        </Button>
                    )}
                </HStack>
            )}
            {isReplying && canReply && (
                <CommentForm
                    compact
                    autoFocus
                    className={cls.replyForm}
                    placeholder={t('comments.replyPlaceholder', {
                        username: comment.user.username,
                    })}
                    onSendComment={handleSubmitReply}
                    onCancel={() => setIsReplying(false)}
                />
            )}
        </VStack>
    );
};
