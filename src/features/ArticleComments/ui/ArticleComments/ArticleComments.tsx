import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Comment, CommentForm, CommentList } from '@/entities/Comment';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import { AuthRequiredNotice } from '@/shared/ui/AuthRequiredNotice/AuthRequiredNotice';
import { getUserAuthData, userActions } from '@/entities/User';
import {
    useAddArticleComment,
    useDeleteArticleComment,
    useGetArticleComments,
} from '../../api/articleCommentsApi';

interface ArticleCommentsProps {
    className?: string;
    id?: string;
}

export const ArticleComments = memo((props: ArticleCommentsProps) => {
    const { className = '', id } = props;
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const userData = useSelector(getUserAuthData);
    const {
        data: comments,
        isLoading,
    } = useGetArticleComments(id ?? '', { skip: !id });
    const [addComment] = useAddArticleComment();
    const [deleteComment] = useDeleteArticleComment();

    const onSendComment = useCallback(
        (text: string) => {
            if (!id || !userData) {
                return;
            }
            addComment({ articleId: id, userId: userData.id, text });
        },
        [addComment, id, userData],
    );

    const onLogin = useCallback(() => {
        dispatch(userActions.openLoginModal());
    }, [dispatch]);

    // Кнопка «Ответить» видна всем (кнопку и мини-форму под конкретным
    // комментарием рисует сам CommentCard), но нажатие гостем открывает вход,
    // а не форму — участвовать можно только после входа. Решение об этом
    // принимает фича, а не CommentCard/CommentList в entities.
    const onReplyClick = useCallback(() => {
        if (!userData) {
            dispatch(userActions.openLoginModal());
        }
    }, [dispatch, userData]);

    const onSubmitReply = useCallback(
        (comment: Comment, text: string) => {
            if (!id || !userData) return;
            addComment({ articleId: id, userId: userData.id, text, parentId: comment.id });
        },
        [addComment, id, userData],
    );

    const onDeleteClick = useCallback(
        (comment: Comment) => {
            if (!id) return;
            deleteComment({ id: comment.id, articleId: id });
        },
        [deleteComment, id],
    );

    return (
        <VStack gap='16' max className={classNames('', {}, [className])}>
            <Text size={TextSize.L} title={t('article.comments')} />
            {/* Обсуждение видно всем, а участвовать в нём можно после входа. */}
            {userData ? (
                <CommentForm onSendComment={onSendComment} />
            ) : (
                <AuthRequiredNotice text={t('auth.toComment')} onLogin={onLogin} />
            )}
            <CommentList
                isLoading={isLoading}
                comments={comments}
                canReply={Boolean(userData)}
                onReplyClick={onReplyClick}
                onSubmitReply={onSubmitReply}
                currentUserId={userData?.id}
                onDeleteClick={onDeleteClick}
            />
        </VStack>
    );
});
