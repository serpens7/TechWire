import { classNames } from '@/shared/lib/classNames/classNames';
import { useTranslation } from 'react-i18next';
import { memo } from 'react';
import { Page } from '@/widgets/Page';
import { useParams } from 'react-router-dom';
import { Text } from '@/shared/ui/Text/Text';
import { VStack } from '@/shared/ui/Stack';
import { EditableArticleCard } from '@/features/editableArticleCard';
import cls from './ArticleEditPage.module.scss';

interface ArticleEditPageProps {
    className?: string;
}

const ArticleEditPage = memo((props: ArticleEditPageProps) => {
    const { className = '' } = props;
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    return (
        <Page className={classNames(cls.ArticleEditPage, {}, [className])}>
            <VStack gap='16' max>
                <Text
                    title={
                        isEdit
                            ? t('article.editWithId') + id
                            : t('article.newArticleCreation')
                    }
                />
                <EditableArticleCard id={id} />
            </VStack>
        </Page>
    );
});

export default ArticleEditPage;
