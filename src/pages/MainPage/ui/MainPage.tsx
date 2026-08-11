import { Page } from '@/widgets/Page';
import { ArticleOfTheDay } from '@/features/articleOfTheDay';
import { SnippetOfTheDay } from '@/features/snippetOfTheDay';
import { VStack } from '@/shared/ui/Stack';
import cls from './MainPage.module.scss';

const MainPage = () => {
    return (
        <Page>
            <VStack gap='32' max className={cls.MainPage}>
                <ArticleOfTheDay />
                <SnippetOfTheDay />
            </VStack>
        </Page>
    );
};

export default MainPage;
