import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Global, чтобы JwtService был доступен гвардам, которые app.module
 * регистрирует через APP_GUARD.
 */
@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: {
                    // Из env всегда приходит просто string, а типы ждут
                    // литеральный формат вида '7d' | '12h' | число секунд.
                    // Проверить это статически нельзя — утверждаем явно.
                    expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
                        '7d') as JwtSignOptions['expiresIn'],
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard, RolesGuard],
    exports: [JwtModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
