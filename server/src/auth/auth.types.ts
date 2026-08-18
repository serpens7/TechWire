import type { UserRole } from '../../generated/prisma/client';

/** Полезная нагрузка JWT. sub — стандартное поле для идентификатора субъекта. */
export interface JwtPayload {
    sub: string;
    username: string;
    roles: UserRole[];
}

/** То, что guard кладёт в request.user после успешной проверки токена. */
export interface AuthenticatedUser {
    id: string;
    username: string;
    roles: UserRole[];
}

/** Fastify-запрос с прикреплённым пользователем. */
export interface RequestWithUser {
    user?: AuthenticatedUser;
    headers: Record<string, string | string[] | undefined>;
}
