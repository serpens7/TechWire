import {
    Body,
    ConflictException,
    Controller,
    ForbiddenException,
    Get,
    Injectable,
    Module,
    NotFoundException,
    Param,
    Put,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiConflictResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { publicUserSelect, serializeProfile } from '../common/serialization/serializers';
import { ProfileDto } from '../common/serialization/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

const updateProfileSchema = z.object({
    first: z.string().optional(),
    lastname: z.string().optional(),
    age: z.coerce.number().int().min(0).max(150).optional(),
    city: z.string().optional(),
    currency: z.enum(['RUB', 'EUR', 'USD']).optional(),
    country: z.enum(['Russia', 'Belarus', 'Ukraine', 'Kazahstan', 'Armenia']).optional(),
    // Форма профиля правит и эти два поля, но хранятся они в User —
    // раскладываем обратно по таблицам.
    username: z.string().min(1).optional(),
    avatar: z.string().optional(),
    id: z.string().optional(),
});

type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export class UpdateProfileBodyDto extends createZodDto(updateProfileSchema) {}

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) {}

    async findOne(id: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id },
            include: { user: { select: publicUserSelect } },
        });

        if (!profile) {
            throw new NotFoundException(`Профиль ${id} не найден`);
        }

        return serializeProfile(profile);
    }

    async update(id: string, dto: UpdateProfileDto, currentUser: AuthenticatedUser) {
        const profile = await this.prisma.profile.findUnique({ where: { id } });

        if (!profile) {
            throw new NotFoundException(`Профиль ${id} не найден`);
        }

        // Фронт прячет кнопку правки на чужом профиле (canEdit в
        // EditableProfileCardHeader), но это только UX — запрет здесь.
        if (profile.userId !== currentUser.id) {
            throw new ForbiddenException('Можно править только свой профиль');
        }

        // Профиль и пользователь меняются вместе: если новый username занят,
        // не должно остаться половинчатой записи.
        try {
            const updated = await this.prisma.$transaction(async (tx) => {
                if (dto.username !== undefined || dto.avatar !== undefined) {
                    await tx.user.update({
                        where: { id: profile.userId },
                        data: {
                            ...(dto.username !== undefined ? { username: dto.username } : {}),
                            ...(dto.avatar !== undefined ? { avatar: dto.avatar } : {}),
                        },
                    });
                }

                return tx.profile.update({
                    where: { id },
                    data: {
                        first: dto.first ?? null,
                        lastname: dto.lastname ?? null,
                        age: dto.age ?? null,
                        city: dto.city ?? null,
                        currency: dto.currency ?? null,
                        country: dto.country ?? null,
                    },
                    include: { user: { select: publicUserSelect } },
                });
            });

            return serializeProfile(updated);
        } catch (error) {
            // Уникальный индекс на username.
            if ((error as { code?: string }).code === 'P2002') {
                throw new ConflictException('Такой логин уже занят');
            }

            throw error;
        }
    }
}

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
    constructor(private readonly profile: ProfileService) {}

    @ApiOperation({
        summary: 'Профиль',
        description: 'username и avatar склеиваются из связанного пользователя.',
    })
    @ApiOkResponse({ type: ProfileDto })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.profile.findOne(id);
    }

    @ApiOperation({ summary: 'Изменить профиль', description: 'Только свой собственный.' })
    @ApiBody({ type: UpdateProfileBodyDto })
    @ApiOkResponse({ type: ProfileDto })
    @ApiForbiddenResponse({ description: 'Можно править только свой профиль' })
    @ApiConflictResponse({ description: 'Такой логин уже занят' })
    @Put(':id')
    update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.profile.update(id, dto, user);
    }
}

@Module({
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class ProfileModule {}
