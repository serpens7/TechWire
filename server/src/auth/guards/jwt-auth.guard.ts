import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { JwtPayload, RequestWithUser } from '../auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        const header = request.headers.authorization;

        if (isPublic) {
            // Публичный маршрут не требует токена, но если он есть и валиден —
            // кладём пользователя в request.user. Нужно так, чтобы, например,
            // GET /articles/:id мог не засчитывать автору просмотр собственной
            // статьи. Битый или просроченный токен здесь не ошибка: маршрут
            // публичный, запрос просто обслуживается как гостевой.
            if (typeof header === 'string' && header.startsWith('Bearer ')) {
                try {
                    const payload = await this.jwt.verifyAsync<JwtPayload>(
                        header.slice('Bearer '.length),
                    );

                    request.user = {
                        id: payload.sub,
                        username: payload.username,
                        roles: payload.roles,
                    };
                } catch {
                    // Намеренно проглочено — см. комментарий выше.
                }
            }

            return true;
        }

        if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
            throw new UnauthorizedException('Отсутствует токен');
        }

        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(header.slice('Bearer '.length));

            request.user = {
                id: payload.sub,
                username: payload.username,
                roles: payload.roles,
            };

            return true;
        } catch {
            throw new UnauthorizedException('Токен недействителен или истёк');
        }
    }
}
