import MainIcon from '@/shared/assets/icons/main-20-20.svg';
import AboutIcon from '@/shared/assets/icons/about-20-20.svg';
import ArticleIcon from '@/shared/assets/icons/article-20-20.svg';
import { getRouteAbout, getRouteArticles, getRouteMain } from '@/shared/const/router';
import { SidebarItemType } from './types/sidebar';

/**
 * Пункты бокового меню.
 *
 * Все три доступны без входа: чтение статей открыто, поэтому прятать ссылку
 * на каталог не от чего — раньше она показывалась только вошедшим, потому что
 * сам маршрут был authOnly.
 *
 * Обычная константа, а не селектор: от состояния список больше не зависит.
 * Селектор пришлось бы оборачивать в createSelector ради стабильной ссылки,
 * иначе useMemo в Sidebar пересчитывался бы на каждый рендер.
 *
 * Профиль сюда не добавляется: он и так есть в выпадающем меню в шапке.
 */
export const sidebarItems: SidebarItemType[] = [
    {
        path: getRouteMain(),
        Icon: MainIcon,
        text: 'sidebar.main',
    },
    {
        path: getRouteAbout(),
        Icon: AboutIcon,
        text: 'sidebar.about',
    },
    {
        path: getRouteArticles(),
        Icon: ArticleIcon,
        text: 'sidebar.articles',
    },
];
