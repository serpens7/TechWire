import { AboutPage } from '@/pages/AboutPage';
import { MainPage } from '@/pages/MainPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { ArticlesPage } from '@/pages/ArticlesPage';
import { ArticleDetailsPage } from '@/pages/ArticleDetailsPage';
import { ArticleEditPage } from '@/pages/ArticleEditPage';
import { AuthorPage } from '@/pages/AuthorPage';
import {
    AppRoutes,
    AppRouteProps,
    getRouteAbout,
    getRouteArticleCreate,
    getRouteArticleDetails,
    getRouteArticleEdit,
    getRouteArticles,
    getRouteAuthor,
    getRouteForbidden,
    getRouteMain,
    getRouteNotFound,
    getRouteProfile,
} from '@/shared/const/router';
import { UserRole } from '@/entities/User';

export const routeConfig: Record<AppRoutes, AppRouteProps> = {
    [AppRoutes.MAIN]: {
        path: getRouteMain(),
        element: <MainPage />,
    },
    [AppRoutes.ABOUT]: {
        path: getRouteAbout(),
        element: <AboutPage />,
    },
    [AppRoutes.PROFILE]: {
        path: getRouteProfile(':id'),
        element: <ProfilePage />,
        authOnly: true,
    },

    [AppRoutes.NOT_FOUND]: {
        path: getRouteNotFound(),
        element: <NotFoundPage />,
    },
    [AppRoutes.FORBIDDEN]: {
        path: getRouteForbidden(),
        element: <ForbiddenPage />,
    },
    // Чтение статей открыто: список и сама статья доступны без входа.
    // По входу закрыто то, что создаёт или меняет содержимое — комментарий,
    // оценка, создание и редактирование статьи.
    [AppRoutes.ARTICLES]: {
        path: getRouteArticles(),
        element: <ArticlesPage />,
    },
    [AppRoutes.ARTICLE_DETAILS]: {
        path: getRouteArticleDetails(':id'),
        element: <ArticleDetailsPage />,
    },
    [AppRoutes.ARTICLE_CREATE]: {
        path: getRouteArticleCreate(),
        element: <ArticleEditPage />,
        authOnly: true,
        roles: [UserRole.ADMIN],
    },
    [AppRoutes.ARTICLE_EDIT]: {
        path: getRouteArticleEdit(':id'),
        element: <ArticleEditPage />,
        authOnly: true,
        roles: [UserRole.ADMIN],
    },
    // Публичная карточка автора — намеренно без authOnly, в отличие от
    // PROFILE выше: та служит редактированию своего профиля, эта — витрина,
    // на которую ведут ссылки из статей и комментариев для любого гостя.
    [AppRoutes.AUTHOR]: {
        path: getRouteAuthor(':id'),
        element: <AuthorPage />,
    },
};
