import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optionalString } from '../common/validation/query';
import { serializeNotification } from '../common/serialization/serializers';

const findNotificationsQuerySchema = z.object({
    userId: optionalString,
});

type FindNotificationsQuery = z.infer<typeof findNotificationsQuerySchema>;

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMany(query: FindNotificationsQuery) {
        const notifications = await this.prisma.notification.findMany({
            where: query.userId ? { userId: query.userId } : {},
        });

        return notifications.map(serializeNotification);
    }
}

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) {}

    /** Фронт опрашивает этот эндпоинт раз в 5 с, пока открыт Popover с уведомлениями. */
    @Get()
    findMany(
        @Query(new ZodValidationPipe(findNotificationsQuerySchema)) query: FindNotificationsQuery,
    ) {
        return this.notifications.findMany(query);
    }
}

@Module({
    controllers: [NotificationsController],
    providers: [NotificationsService],
})
export class NotificationsModule {}
