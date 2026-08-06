import { memo, useCallback, useMemo } from 'react';
import { Virtuoso, VirtuosoGrid, ListRange } from 'react-virtuoso';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { classNames } from '@/shared/lib/classNames/classNames';
import {
    Article,
    ArticleView,
    ArticleListItem,
    ArticleListItemSkeleton,
} from '@/entities/Article';
import { useAppDispatch } from '@/shared/lib/hooks/useAppDispatch';
import {
    getArticlesPageIsLoading,
    getArticlesPageLimit,
    getArticlesPageView,
} from '../../model/selectors/articlesPageSelectors';
import { getArticles } from '../../model/slices/articlePageSlice';
import { fetchNextArticlesPage } from '../../model/services/fetchNextArticlesPage';
import { ArticlesPageFilters } from '../ArticlesPageFilters/ArticlesPageFilters';
import cls from './ArticlesPageList.module.scss';

interface ArticlesPageListProps {
    className?: string;
}

interface ListContext {
    isLoading?: boolean;
    view: ArticleView;
    limit: number;
}

const savedTopIndexByPath: Record<string, number> = {};

const getSkeletons = (view: ArticleView, count: number) =>
    new Array(count).fill(0).map((_, index) => (
        <ArticleListItemSkeleton
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            view={view}
            className={view === ArticleView.BIG ? cls.bigCard : undefined}
        />
    ));

const Header = () => (
    <div className={cls.header}>
        <ArticlesPageFilters />
    </div>
);

// Skeletons are rendered through Virtuoso's Footer (which sits below the real
// item flow) rather than mixed into `data`. Injecting placeholder items into
// `data` poisons `endReached`'s internal high-water-mark — once it fires for a
// skeleton index, the real item that later takes the same index never
// re-triggers it, and pagination silently stops. Keeping `data` = real
// articles only keeps `endReached` reliable.
const Footer = ({ context }: { context: ListContext }) => {
    if (!context.isLoading) {
        return null;
    }
    const isSmall = context.view === ArticleView.SMALL;
    return (
        <div className={isSmall ? cls.skeletonsGrid : cls.skeletonsList}>
            {getSkeletons(context.view, context.limit)}
        </div>
    );
};

const components = { Header, Footer };

export const ArticlesPageList = memo((props: ArticlesPageListProps) => {
    const { className = '' } = props;
    const dispatch = useAppDispatch();
    const articles = useSelector(getArticles.selectAll);
    const isLoading = useSelector(getArticlesPageIsLoading);
    const limit = useSelector(getArticlesPageLimit);
    const view = useSelector(getArticlesPageView);
    const { pathname } = useLocation();

    const onLoadNextPart = useCallback(() => {
        dispatch(fetchNextArticlesPage());
    }, [dispatch]);

    const context = useMemo<ListContext>(
        () => ({ isLoading, view, limit }),
        [isLoading, view, limit],
    );

    const initialTopMostItemIndex = savedTopIndexByPath[pathname] ?? 0;
    const wrapperClassName = classNames(cls.wrapper, {}, [className]);

    const onRangeChanged = useCallback((range: ListRange) => {
        savedTopIndexByPath[pathname] = range.startIndex;
    }, [pathname]);

    const computeItemKey = useCallback(
        (_: number, article: Article) => article.id,
        [],
    );

    const renderArticle = useCallback(
        (_: number, article: Article) => (
            <ArticleListItem
                article={article}
                view={view}
                className={view === ArticleView.BIG ? cls.bigCard : undefined}
            />
        ),
        [view],
    );

    return (
        <div className={wrapperClassName}>
            {view === ArticleView.BIG ? (
                <Virtuoso
                    style={{ height: '100%' }}
                    data={articles}
                    context={context}
                    initialTopMostItemIndex={initialTopMostItemIndex}
                    endReached={onLoadNextPart}
                    rangeChanged={onRangeChanged}
                    computeItemKey={computeItemKey}
                    itemContent={renderArticle}
                    components={components}
                />
            ) : (
                <VirtuosoGrid
                    style={{ height: '100%' }}
                    data={articles}
                    context={context}
                    initialTopMostItemIndex={initialTopMostItemIndex}
                    endReached={onLoadNextPart}
                    rangeChanged={onRangeChanged}
                    computeItemKey={computeItemKey}
                    listClassName={cls.itemsWrapper}
                    itemContent={renderArticle}
                    components={components}
                />
            )}
        </div>
    );
});
