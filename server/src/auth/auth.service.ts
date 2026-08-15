import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { serializeUser } from '../common/serialization/serializers';
import type { User } from '../../generated/prisma/client';
import type { JwtPayload } from './auth.types';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

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
        const hash =
            user?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin';
        const passwordMatches = await bcrypt.compare(password, hash);

        if (!user || !passwordMatches) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        return this.issueToken(user);
    }

    async register({ username, password }: RegisterDto) {
        // Дешёвая проверка перед хэшированием — не обязательна для корректности
        // (её всё равно дублирует уникальный индекс), но экономит bcrypt-раунды
        // на заведомо занятый логин и даёт понятную ошибку в общем случае.
        const existing = await this.prisma.user.findUnique({ where: { username } });

        if (existing) {
            throw new ConflictException('Такой логин уже занят');
        }

        const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        try {
            const user = await this.prisma.$transaction(async (tx) => {
                const created = await tx.user.create({
                    data: { username, password: hash, roles: ['USER'] },
                });

                // id профиля намеренно равен id пользователя — так же, как у
                // сидовых записей (profile.id === user.id). GET/PUT /profile/:id
                // и ссылки на автора по всему фронту передают id пользователя;
                // рассинхронизация здесь означала бы 404 на собственном профиле
                // у любого, кто зарегистрировался, а не пришёл из сида.
                await tx.profile.create({ data: { id: created.id, userId: created.id } });

                return created;
            });

            return this.issueToken(user);
        } catch (error) {
            // Защита от гонки: два одновременных запроса с одинаковым логином
            // проходят проверку выше синхронно, но упрутся в уникальный индекс.
            if ((error as { code?: string }).code === 'P2002') {
                throw new ConflictException('Такой логин уже занят');
            }

            throw error;
        }
    }

    private async issueToken(user: User) {
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
