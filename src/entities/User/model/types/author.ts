/**
 * Публичная карточка автора (GET /users/:id) — заметно уже Profile: только
 * то, что не персональные данные, плюс число опубликованных статей.
 */
export interface Author {
    id: string;
    username: string;
    avatar?: string;
    first?: string;
    lastname?: string;
    articlesCount: number;
}
