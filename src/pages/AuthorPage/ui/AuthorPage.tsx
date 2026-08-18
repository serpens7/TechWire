import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { classNames } from '@/shared/lib/classNames/classNames';
import { Page } from '@/widgets/Page';
import { VStack } from '@/shared/ui/Stack';
import { Button, ButtonTheme } from '@/shared/ui/Button/Button';
import { AuthorCard, useGetAuthorQuery } from '@/entities/User';
import { ArticleList, useGetArticlesByAuthorQuery } from '@/entities/Article';

const PAGE_SIZE = 12;

interface AuthorPageProps {
    className?: string;
}

const AuthorPage = ({ className }: AuthorPageProps) => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const [limit, setLimit] = useState(PAGE_SIZE);

    const { data: author, isLoading: isAuthorLoading } = useGetAuthorQuery(id ?? '', {
        skip: !id,
    });
    const { data: articles, isFetching: isArticlesLoading } = useGetArticlesByAuthorQuery(
        { userId: id ?? '', limit },
        { skip: !id },
    );

    const onShowMore = () => setLimit((prev) => prev + PAGE_SIZE);

    const hasMore = author ? (articles?.length ?? 0) < author.articlesCount : false;

    return (
        <Page className={classNames('', {}, [className ?? ''])}>
            <VStack gap='16' max>
                <AuthorCard author={author} isLoading={isAuthorLoading} />
                <ArticleList
                    articles={articles ?? []}
                    isLoading={isArticlesLoading && !articles}
                />
                {hasMore && (
                    <Button theme={ButtonTheme.OUTLINE} onClick={onShowMore}>
                        {t('author.showMore')}
                    </Button>
                )}
            </VStack>
        </Page>
    );
};

export default AuthorPage;
