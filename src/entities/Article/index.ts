export {
    ArticleDetails,
} from './ui/ArticleDetails/ArticleDetails';

export type {
    Article,
    ArticleBlock,
    ArticleCodeBlock,
} from './model/types/article';

export {
    ArticleView,
    ArticleSortField,
    ArticleType,
    ArticleBlockType,
} from './model/types/article';

export {
    articleDetailsReducer,
    articleDetailsActions,
} from './model/slice/articleDetailsSlice';

export { ArticleList } from './ui/ArticleList/ArticleList';

export { ArticleListItem } from './ui/ArticleListItem/ArticleListItem';

export { ArticleListItemSkeleton } from './ui/ArticleListItem/ArticleListItemSkeleton';

export { ArticleTypeTabs } from './ui/ArticleTypeTabs/ArticleTypeTabs';

export type { ArticleDetailsSchema } from './model/types/articleDetailsSchema';

export type {
    Highlights,
    ArticleTeaser,
    SnippetTeaser,
} from './model/types/highlights';

export { useHighlights } from './api/highlightsApi';

export { getArticleDetailsData } from './model/selectors/articleDetails';
