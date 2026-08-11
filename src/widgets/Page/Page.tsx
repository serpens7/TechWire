import { classNames } from '@/shared/lib/classNames/classNames';
import {
    MutableRefObject,
    ReactNode,
    UIEvent,
    useCallback,
    useRef,
} from 'react';
import cls from './Page.module.scss';
import { useInfiniteScroll } from '@/shared/lib/hooks/useInfiniteScroll';
import { scrollSaver } from '@/shared/lib/scroll/scrollSaver';
import { useInitialEffect } from '@/shared/lib/hooks/useInitialEffect';
import { useLocation } from 'react-router-dom';

interface PageProps {
    className?: string;
    children: ReactNode;
    onScrollEnd?: () => void;
}

export const Page = (props: PageProps) => {
    const { className = '', children, onScrollEnd } = props;
    const wrapperRef = useRef() as MutableRefObject<HTMLDivElement>;
    const triggerRef = useRef() as MutableRefObject<HTMLDivElement>;
    const { pathname } = useLocation();

    useInfiniteScroll({
        triggerRef,
        wrapperRef,
        callback: onScrollEnd,
    });

    useInitialEffect(() => {
        wrapperRef.current.scrollTop = scrollSaver.getScroll(pathname);
    });

    const onScroll = useCallback(
        (e: UIEvent<HTMLDivElement>) => {
            scrollSaver.setScroll(pathname, e.currentTarget.scrollTop);
        },
        [pathname]
    );

    return (
        <main
            ref={wrapperRef}
            className={classNames(cls.Page, {}, [className])}
            onScroll={onScroll}
        >
            {/* Content column — its horizontal geometry (gutter from the
                sidebar, matching empty strip on the right) lives in
                Page.module.scss. */}
            <div className={cls.content}>{children}</div>
            <div ref={triggerRef} />
        </main>
    );
};
