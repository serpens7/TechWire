import { RefObject, useEffect, useRef } from 'react';

export interface UseInfiniteScrollOptions {
    callback?: () => void;
    triggerRef: RefObject<HTMLElement | null>;
    wrapperRef: RefObject<HTMLElement | null>;
    rootMargin?: string;
}

export function useInfiniteScroll({
    callback,
    wrapperRef,
    triggerRef,
    rootMargin = '0px 0px 300px 0px',
}: UseInfiniteScrollOptions) {

    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        const wrapperElement = wrapperRef.current;
        const triggerElement = triggerRef.current;

        if (!triggerElement) {
            return undefined;
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                callbackRef.current?.();
            }
        }, {
            root: wrapperElement,
            rootMargin,
            threshold: 0,
        });

        observer.observe(triggerElement);

        // The IntersectionObserver only reacts when the trigger crosses the root
        // boundary. If freshly loaded content isn't tall enough to push the trigger
        // past the root margin, it stays "intersecting" and never fires again — you'd
        // have to scroll up and back down to re-trigger it. Re-observe the trigger
        // whenever the wrapper's content changes so the observer re-evaluates the
        // current state and keeps loading until the trigger finally leaves the margin.
        let frame = 0;
        const reobserve = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                observer.unobserve(triggerElement);
                observer.observe(triggerElement);
            });
        };

        const mutationObserver = new MutationObserver(reobserve);
        if (wrapperElement) {
            mutationObserver.observe(wrapperElement, {
                childList: true,
                subtree: true,
            });
        }

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, [triggerRef, wrapperRef, rootMargin]);
}
