import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiTooManyRequestsResponse,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { LoginResponseDto, UserDto } from '../common/serialization/schemas';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginBodyDto, loginSchema, type LoginDto } from './dto/login.dto';
import { RegisterBodyDto, registerSchema, type RegisterDto } from './dto/register.dto';
import type { AuthenticatedUser } from './auth.types';

// ThrottlerGuard навешан только здесь, а не глобально через APP_GUARD:
// перебор пароля имеет смысл ограничивать в auth-маршрутах, а не во всём API.
@ApiTags('auth')
@ApiTooManyRequestsResponse({ description: 'Слишком много попыток входа, попробуйте позже' })
@UseGuards(ThrottlerGuard)
@Controller()
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    /**
     * Путь без префикса — /login, как было у json-server: фронт ходит именно сюда.
     * Отвечает { user, token }: раньше здесь отдавался голый объект пользователя,
     * который фронт и использовал в качестве «токена».
     */
    @ApiOperation({
        summary: 'Вход',
        description: 'Отвечает одинаково на неверный пароль и несуществующий логин.',
    })
    @ApiBody({ type: LoginBodyDto })
    @ApiOkResponse({ type: LoginResponseDto })
    @ApiUnauthorizedResponse({ description: 'Неверный логин или пароль' })
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
        return this.auth.login(dto);
    }

    /**
     * Регистрация. Отвечает той же формой, что и /login ({ user, token }) —
     * фронт сразу входит только что созданным пользователем, без второго запроса.
     * Роль всегда USER: назначить ADMIN/MANAGER через API нельзя, только сидом
     * или прямой правкой БД.
     */
    @ApiOperation({ summary: 'Регистрация' })
    @ApiBody({ type: RegisterBodyDto })
    @ApiCreatedResponse({ type: LoginResponseDto })
    @ApiConflictResponse({ description: 'Такой логин уже занят' })
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto) {
        return this.auth.register(dto);
    }

    /**
     * Кто я по текущему токену. Фронт пока гидратируется из localStorage, но
     * этот эндпоинт — правильный путь для проверки живости сессии.
     */
    @ApiOperation({ summary: 'Текущий пользователь по токену' })
    @ApiBearerAuth()
    @ApiOkResponse({ type: UserDto })
    @Get('auth/me')
    me(@CurrentUser() user: AuthenticatedUser | undefined) {
        return user;
    }
}
