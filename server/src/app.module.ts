import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { ResponseDelayInterceptor } from './common/interceptors/response-delay.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ArticlesModule } from './articles/articles.module';
import { HighlightsModule } from './highlights/highlights.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';
import { RatingsModule } from './ratings/ratings.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        ArticlesModule,
        HighlightsModule,
        CommentsModule,
        NotificationsModule,
        ProfileModule,
        RatingsModule,
    ],
    controllers: [HealthController],
    providers: [
        // Закрыто по умолчанию: без токена не пускаем никуда, кроме маршрутов,
        // помеченных @Public(). Так же вёл себя json-server, отвергавший любой
        // запрос без заголовка authorization.
        //
        // Порядок важен: JwtAuthGuard кладёт пользователя в запрос, RolesGuard
        // затем проверяет его роли. Гварды выполняются в порядке регистрации.
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseDelayInterceptor,
        },
    ],
})
export class AppModule {}
