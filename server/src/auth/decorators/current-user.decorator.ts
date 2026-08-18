import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser, RequestWithUser } from '../auth.types';

/** Достаёт пользователя, положенного в запрос гвардом. */
export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): AuthenticatedUser | undefined => {
        const request = context.switchToHttp().getRequest<RequestWithUser>();

        return request.user;
    },
);
