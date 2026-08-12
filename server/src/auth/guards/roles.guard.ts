import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { RequestWithUser } from '../auth.types';
import type { UserRole } from '../../../generated/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Маршрут не объявил требований к ролям — достаточно быть авторизованным.
        if (!required || required.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const roles = request.user?.roles ?? [];

        if (!required.some((role) => roles.includes(role))) {
            throw new ForbiddenException('Недостаточно прав');
        }

        return true;
    }
}
