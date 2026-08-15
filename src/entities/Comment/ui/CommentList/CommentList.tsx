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
    onReply?: (comment: Comment) => void;
}

export const CommentList = (props: CommentListProps) => {
    const {
        className = '', isLoading, comments, onReply,
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
                        <CommentCard comment={root} onReply={onReply} />
                        {replies.map((reply) => (
                            <CommentCard
                                isReply
                                comment={reply}
                                onReply={onReply}
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
