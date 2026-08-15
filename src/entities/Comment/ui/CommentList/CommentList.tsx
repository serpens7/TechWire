import { classNames } from '@/shared/lib/classNames/classNames';
import { Text } from '@/shared/ui/Text/Text';
import { useTranslation } from 'react-i18next';
import { CommentCard } from '../CommentCard/CommentCard';
import { Comment } from '../../model/types/comment';
import { groupComments } from '../../model/lib/groupComments';
import { VStack } from '@/shared/ui/Stack';

interface CommentListProps {
    className?: string;
    comments?: Comment[];
    isLoading?: boolean;
    canReply?: boolean;
    onReplyClick?: (comment: Comment) => void;
    onSubmitReply?: (comment: Comment, text: string) => void;
    /** Чей это комментарий — только владелец видит «Удалить». Простое равенство id. */
    currentUserId?: string;
    onDeleteClick?: (comment: Comment) => void;
}

export const CommentList = (props: CommentListProps) => {
    const {
        className = '',
        isLoading,
        comments,
        canReply,
        onReplyClick,
        onSubmitReply,
        currentUserId,
        onDeleteClick,
    } = props;
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <VStack gap='16' max className={classNames('', {}, [className])}>
                <CommentCard isLoading />
                <CommentCard isLoading />
                <CommentCard isLoading />
            </VStack>
        );
    }

    const groups = groupComments(comments ?? []);

    return (
        <VStack gap='16' max className={classNames('', {}, [className])}>
            {groups.length ? (
                groups.map(({ root, replies }) => (
                    <VStack gap='8' max key={root.id}>
                        <CommentCard
                            comment={root}
                            canReply={canReply}
                            onReplyClick={onReplyClick}
                            onSubmitReply={onSubmitReply}
                            isOwn={Boolean(currentUserId) && root.user.id === currentUserId}
                            onDeleteClick={onDeleteClick}
                        />
                        {replies.map((reply) => (
                            <CommentCard
                                isReply
                                comment={reply}
                                canReply={canReply}
                                onReplyClick={onReplyClick}
                                onSubmitReply={onSubmitReply}
                                isOwn={Boolean(currentUserId) && reply.user.id === currentUserId}
                                onDeleteClick={onDeleteClick}
                                key={reply.id}
                            />
                        ))}
                    </VStack>
                ))
            ) : (
                <Text text={t('comments.notFound')} />
            )}
        </VStack>
    );
};
