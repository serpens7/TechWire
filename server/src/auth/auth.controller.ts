import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { loginSchema, type LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './auth.types';

@Controller()
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    /**
     * Путь без префикса — /login, как было у json-server: фронт ходит именно сюда.
     * Отвечает { user, token }: раньше здесь отдавался голый объект пользователя,
     * который фронт и использовал в качестве «токена».
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
        return this.auth.login(dto);
    }

    /**
     * Кто я по текущему токену. Фронт пока гидратируется из localStorage, но
     * этот эндпоинт — правильный путь для проверки живости сессии.
     */
    @Get('auth/me')
    me(@CurrentUser() user: AuthenticatedUser | undefined) {
        return user;
    }
}
