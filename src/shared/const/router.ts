import { RouteProps } from 'react-router-dom';
import { UserRole } from '@/shared/const/rbac';

export enum AppRoutes {
    MAIN = 'main',
    ABOUT = 'about',
    NOT_FOUND = 'not_found',
    FORBIDDEN = 'forbidden',
    PROFILE = 'profile',
    ARTICLE_DETAILS = 'article_details',
    ARTICLE_CREATE = 'article_create',
    ARTICLE_EDIT = 'article_edit',
    ARTICLES = 'articles',
    AUTHOR = 'author',
}

export type AppRouteProps = RouteProps & {
    authOnly?: boolean;
    roles?: UserRole[];
};

export const getRouteMain = () => '/';
export const getRouteAbout = () => '/about';
export const getRouteArticles = () => '/articles';
export const getRouteArticleCreate = () => '/articles/new';
export const getRouteArticleDetails = (id: string) => `/articles/${id}`;
export const getRouteArticleEdit = (id: string) => `/articles/${id}/edit`;
export const getRouteProfile = (id: string) => `/profile/${id}`;
// Публичная карточка автора. Отдельно от /profile/:id: тот закрыт токеном и
// нужен только для редактирования собственного профиля, а сюда ведут ссылки
// с именем автора в статье, комментарии и на главной — доступные гостю.
export const getRouteAuthor = (id: string) => `/users/${id}`;
export const getRouteForbidden = () => '/forbidden';
export const getRouteNotFound = () => '*';
