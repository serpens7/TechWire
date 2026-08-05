import { classNames, Mods } from '@/shared/lib/classNames/classNames';
import React, { ReactNode } from 'react';
import { useModal } from '@/shared/lib/hooks/useModal';
import cls from './Modal.module.scss';
import { Portal } from '../Portal/Portal';

interface ModalProps {
    className?: string;
    children?: ReactNode;
    isOpen?: boolean;
    onClose?: () => void;
    lazy?: boolean;
}

const ANIMATION_DELAY = 300;

export const Modal = (props: ModalProps) => {
    const { className = '', children, isOpen, onClose, lazy } = props;

    const { isClosing, isMounted, close } = useModal({
        onClose,
        isOpen,
        animationDelay: ANIMATION_DELAY,
    });

    const onContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const mods: Mods = {
        [cls.opened]: isOpen,
        [cls.isClosing]: isClosing,
    };

    if (lazy && !isMounted) {
        return null;
    }

    return (
        <Portal>
            <div className={classNames(cls.Modal, mods, [className])}>
                <div className={cls.overlay} onClick={close}>
                    {/* onClick only stops the overlay's close-on-click from firing
                        when interacting with the dialog body; the dialog is closed
                        via the overlay, Escape (useModal), or its own controls. */}
                    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
                    <div
                        className={cls.content}
                        onClick={onContentClick}
                        role="dialog"
                        aria-modal="true"
                    >
                        {children}
                    </div>
                </div>
            </div>
        </Portal>
    );
};
