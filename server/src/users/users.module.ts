import { Controller, Get, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { publicUserSelect, serializePublicAuthor } from '../common/serialization/serializers';
import { PublicAuthorDto } from '../common/serialization/schemas';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                ...publicUserSelect,
                profile: { select: { first: true, lastname: true } },
            },
        });

        if (!user) {
            throw new NotFoundException(`Пользователь ${id} не найден`);
        }

        const articlesCount = await this.prisma.article.count({ where: { userId: id } });

        return serializePublicAuthor(user, user.profile, articlesCount);
    }
}

/**
 * Публичная страница автора: клик по имени в статье или комментарии ведёт
 * сюда, а не на /profile/:id — тот закрыт токеном и предназначен только для
 * редактирования собственного профиля.
 */
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {}

    @ApiOperation({
        summary: 'Публичная карточка автора',
        description:
            'Уже профиля: только то, что не является личными данными, плюс число опубликованных статей.',
    })
    @ApiOkResponse({ type: PublicAuthorDto })
    @Public()
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.users.findOne(id);
    }
}

@Module({
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
