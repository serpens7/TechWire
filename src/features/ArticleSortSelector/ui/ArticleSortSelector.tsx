import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo, useMemo } from 'react';
import { Select, SelectOption } from '@/shared/ui/Select/Select';
import cls from './ArticleSortSelector.module.scss';
import { SortOrder } from '@/shared/types/types';
import { ArticleSortField } from '../../../entities/Article/model/types/article';

interface ArticleSortSelectorProps {
    className?: string;
    sort: ArticleSortField;
    order: SortOrder;
    onChangeOrder: (newOrder: SortOrder) => void;
    onChangeSort: (newSort: ArticleSortField) => void;
}

export const ArticleSortSelector = memo((props: ArticleSortSelectorProps) => {
    const { className = '', onChangeOrder, onChangeSort, order, sort } = props;
    const { t } = useTranslation();

    const orderOptions = useMemo<SelectOption<SortOrder>[]>(
        () => [
            {
                value: 'asc',
                content: t('article.increment'),
            },
            {
                value: 'desc',
                content: t('article.decrement'),
            },
        ],
        [t]
    );

    const sortFieldOptions = useMemo<SelectOption<ArticleSortField>[]>(
        () => [
            {
                value: ArticleSortField.CREATED,
                content: t('article.createDateSort'),
            },
            {
                value: ArticleSortField.TITLE,
                content: t('article.titleSort'),
            },
            {
                value: ArticleSortField.VIEWS,
                content: t('article.viewsSort'),
            },
        ],
        [t]
    );

    return (
        <div className={classNames(cls.ArticleSortSelector, {}, [className])}>
            <Select
                options={sortFieldOptions}
                label={t('article.sortBy')}
                value={sort}
                onChange={onChangeSort}
            />
            <Select
                options={orderOptions}
                label={t('article.orderBy')}
                value={order}
                onChange={onChangeOrder}
                className={cls.order}
            />
        </div>
    );
});
