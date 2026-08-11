import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HealthController } from './health.controller';
import { ResponseDelayInterceptor } from './common/interceptors/response-delay.interceptor';
import { PrismaModule } from './prisma/prisma.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: ResponseDelayInterceptor,
        },
    ],
})
export class AppModule {}
