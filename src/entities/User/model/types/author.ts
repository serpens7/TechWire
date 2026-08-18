/**
 * Публичная карточка автора (GET /users/:id) — уже Profile: без
 * currency/country. age/city/status пользователь сам решает показать здесь —
 * это то же, что он вводит в форме профиля.
 */
export interface Author {
    id: string;
    username: string;
    avatar?: string;
    first?: string;
    lastname?: string;
    age?: number;
    city?: string;
    status?: string;
    articlesCount: number;
}
