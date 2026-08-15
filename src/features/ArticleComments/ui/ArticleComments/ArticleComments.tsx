import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Comment, CommentForm, CommentList } from '@/entities/Comment';
import { Text, TextSize } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import { AuthRequiredNotice } from '@/shared/ui/AuthRequiredNotice/AuthRequiredNotice';
import { getUserAuthData, userActions } from '@/entities/User';
import {
    useAddArticleComment,
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
    const [replyTo, setReplyTo] = useState<Comment>();

    const onSendComment = useCallback(
        (text: string) => {
            if (!id || !userData) {
                return;
            }
            addComment({ articleId: id, userId: userData.id, text, parentId: replyTo?.id });
            setReplyTo(undefined);
        },
        [addComment, id, userData, replyTo],
    );

    const onLogin = useCallback(() => {
        dispatch(userActions.openLoginModal());
    }, [dispatch]);

    // Гость видит обсуждение и кнопку «Ответить», но нажатие на неё открывает
    // вход, а не форму — участвовать можно только после входа, решение об
    // этом принимает фича, а не CommentCard/CommentList в entities.
    const onReply = useCallback(
        (comment: Comment) => {
            if (!userData) {
                dispatch(userActions.openLoginModal());
                return;
            }
            setReplyTo(comment);
        },
        [dispatch, userData],
    );

    const onCancelReply = useCallback(() => setReplyTo(undefined), []);

    return (
        <VStack gap='16' max className={classNames('', {}, [className])}>
            <Text size={TextSize.L} title={t('article.comments')} />
            {/* Обсуждение видно всем, а участвовать в нём можно после входа. */}
            {userData ? (
                <CommentForm
                    onSendComment={onSendComment}
                    replyTo={replyTo}
                    onCancelReply={onCancelReply}
                />
            ) : (
                <AuthRequiredNotice text={t('auth.toComment')} onLogin={onLogin} />
            )}
            <CommentList isLoading={isLoading} comments={comments} onReply={onReply} />
        </VStack>
    );
});
