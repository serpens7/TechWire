import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../common/serialization/serializers';
import type { JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async login({ username, password }: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { username } });

        // Одинаковая ошибка на «нет пользователя» и «неверный пароль»:
        // иначе эндпоинт превращается в способ узнать, какие логины заняты.
        // bcrypt.compare гоняем и при отсутствии пользователя — так время
        // ответа не выдаёт, существует логин или нет.
        const hash = user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
        const passwordMatches = await bcrypt.compare(password, hash);

        if (!user || !passwordMatches) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            roles: user.roles,
        };

        return {
            user: serializeUser(user),
            token: await this.jwt.signAsync(payload),
        };
    }
}
