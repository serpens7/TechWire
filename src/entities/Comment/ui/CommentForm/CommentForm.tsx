import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo, useState } from 'react';
import { Input } from '@/shared/ui/Input/Input';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { HStack } from '@/shared/ui/Stack';
import cls from './CommentForm.module.scss';

export interface CommentFormProps {
    className?: string;
    onSendComment: (text: string) => void;
    /** Показывает Cancel рядом с Send — используется мини-формой ответа. */
    onCancel?: () => void;
    /** Переопределяет placeholder — мини-форма ответа подставляет "Reply to @user". */
    placeholder?: string;
    autoFocus?: boolean;
    /** Меньше отступов, без своей рамки — форма ответа встраивается под комментарий. */
    compact?: boolean;
}

export const CommentForm = memo((props: CommentFormProps) => {
    const {
        className = '', onSendComment, onCancel, placeholder, autoFocus, compact,
    } = props;
    const { t } = useTranslation();
    const [text, setText] = useState('');

    const onSendHandler = () => {
        onSendComment(text);
        setText('');
    };

    return (
        <HStack
            max
            justify='between'
            className={classNames(cls.CommentForm, { [cls.compact]: Boolean(compact) }, [
                className,
            ])}
        >
            <Input
                autofocus={autoFocus}
                className={cls.input}
                placeholder={placeholder ?? t('comments.enterText')}
                value={text}
                onChange={setText}
            />
            <HStack gap='8'>
                {onCancel && (
                    <Button theme={ButtonTheme.CLEAR} onClick={onCancel}>
                        {t('comments.cancelReply')}
                    </Button>
                )}
                <Button theme={ButtonTheme.OUTLINE} onClick={onSendHandler}>
                    {t('comments.send')}
                </Button>
            </HStack>
        </HStack>
    );
});
