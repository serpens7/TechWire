import { Page } from '@/widgets/Page';
import { ArticleOfTheDay } from '@/features/articleOfTheDay';
import { VStack } from '@/shared/ui/Stack';
import cls from './MainPage.module.scss';

const MainPage = () => {
    return (
        <Page>
            <VStack gap='16' max className={cls.MainPage}>
                <ArticleOfTheDay />
            </VStack>
        </Page>
    );
};

export default MainPage;
