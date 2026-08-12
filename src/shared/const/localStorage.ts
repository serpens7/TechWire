/**
 * JWT, который уходит в заголовок Authorization. Единственное, чему доверяет
 * бэкенд.
 */
export const TOKEN_LOCALSTORAGE_KEY = 'token';

/**
 * Кэш профиля текущего пользователя — только чтобы отрисовать шапку сразу
 * после загрузки, не дожидаясь запроса. Права по нему не проверяются: всё,
 * что реально ограничивает доступ, живёт в токене и проверяется на сервере.
 */
export const USER_LOCALSTORAGE_KEY = 'user';
export const ARTICLES_VIEW_LOCALSTORAGE_KEY = 'articles_view';