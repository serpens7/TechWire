import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo, useState } from 'react';
import { Input } from '@/shared/ui/Input/Input';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { Text } from '@/shared/ui/Text/Text';
import { HStack, VStack } from '@/shared/ui/Stack';
import cls from './CommentForm.module.scss';
import { Comment } from '../../model/types/comment';

export interface CommentFormProps {
    className?: string;
    onSendComment: (text: string) => void;
    /** Комментарий, на который сейчас отвечают — показывает плашку над полем. */
    replyTo?: Comment;
    onCancelReply?: () => void;
}

export const CommentForm = memo((props: CommentFormProps) => {
    const {
        className = '', onSendComment, replyTo, onCancelReply,
    } = props;
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const onSendHandler = () => {
        onSendComment(text);
        setText('');
    };

    return (
        <VStack gap='8' max className={classNames(cls.CommentForm, {}, [className])}>
            {replyTo && (
                <HStack gap='8' max justify='between' className={cls.replyBanner}>
                    <Text
                        text={t('comments.replyingTo', { username: replyTo.user.username })}
                    />
                    <Button theme={ButtonTheme.CLEAR} onClick={onCancelReply}>
                        {t('comments.cancelReply')}
                    </Button>
                </HStack>
            )}
            <HStack max justify='between'>
                <Input
                    className={cls.input}
                    placeholder={t('comments.enterText')}
                    value={text}
                    onChange={setText}
                />
                <Button theme={ButtonTheme.OUTLINE} onClick={onSendHandler}>
                    {t('comments.send')}
                </Button>
            </HStack>
        </VStack>
    );
});
