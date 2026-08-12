import { UserRole } from '../consts/userConsts';

export interface User {
    id: string;
    username: string;
    avatar?: string;
    roles?: UserRole[];
}

export interface UserSchema {
    authData?: User;
    inited: boolean;
    /**
     * Открыта ли модалка входа.
     *
     * Живёт в сторе, а не в локальном состоянии Navbar, потому что открыть её
     * должны уметь и другие места — например блоки главной, когда
     * незалогиненный посетитель пытается открыть статью. Между ними и Navbar
     * нет прямого пути: фичам запрещено импортировать друг друга.
     */
    isLoginModalOpen: boolean;
}
