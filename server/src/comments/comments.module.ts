import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Injectable,
    Module,
    NotFoundException,
    Post,
    Query,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optionalString } from '../common/validation/query';
import { publicUserSelect, serializeComment } from '../common/serialization/serializers';
import { CommentWithUserDto } from '../common/serialization/schemas';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

const findCommentsQuerySchema = z.object({
    articleId: optionalString,
    _expand: optionalString,
});

type FindCommentsQuery = z.infer<typeof findCommentsQuerySchema>;

const createCommentSchema = z.object({
    articleId: z.string().min(1, 'Не указана статья'),
    text: z.string().trim().min(1, 'Комментарий не может быть пустым'),
    // Фронт присылает userId, но автором становится владелец токена —
    // иначе можно было бы оставить комментарий от чужого имени.
    userId: z.string().optional(),
    // Комментарий, на который отвечают. Схлопывается до корня и получает
    // проверенный replyToUserId — см. CommentsService.create.
    parentId: z.string().optional(),
});

type CreateCommentDto = z.infer<typeof createCommentSchema>;

export class CreateCommentBodyDto extends createZodDto(createCommentSchema) {}

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMany(query: FindCommentsQuery) {
        const expandUser = query._expand === 'user';

        const comments = await this.prisma.comment.findMany({
            where: query.articleId ? { articleId: query.articleId } : {},
            // Устойчивый порядок нужен именно ради веток: без него ответы и
            // корневые комментарии перемешивались бы между перезагрузками.
            orderBy: { createdAt: 'asc' },
            ...(expandUser
                ? {
                      include: {
                          user: { select: publicUserSelect },
                          replyToUser: { select: publicUserSelect },
                      },
                  }
                : {}),
        });

        return comments.map((comment) => serializeComment(comment, { expandUser }));
    }

    async create(dto: CreateCommentDto, authorId: string) {
        const article = await this.prisma.article.findUnique({
            where: { id: dto.articleId },
            select: { id: true },
        });

        if (!article) {
            throw new NotFoundException(`Статья ${dto.articleId} не найдена`);
        }

        // Схлопывание в один уровень: ответ на ответ прикрепляется к тому же
        // корню, что и его родитель, а не образует более глубокую ветку.
        // replyToUserId берётся с сервера (кто автор родителя), а не из
        // тела — иначе подпись "@username" можно было бы подделать.
        let parentId: string | undefined;
        let replyToUserId: string | undefined;

        if (dto.parentId) {
            const parent = await this.prisma.comment.findUnique({
                where: { id: dto.parentId },
                select: { id: true, articleId: true, parentId: true, userId: true },
            });

            if (!parent) {
                throw new NotFoundException(`Комментарий ${dto.parentId} не найден`);
            }

            if (parent.articleId !== dto.articleId) {
                throw new BadRequestException('Родительский комментарий из другой статьи');
            }

            parentId = parent.parentId ?? parent.id;
            replyToUserId = parent.userId;
        }

        const comment = await this.prisma.comment.create({
            data: {
                text: dto.text,
                articleId: dto.articleId,
                userId: authorId,
                parentId,
                replyToUserId,
            },
            include: {
                user: { select: publicUserSelect },
                replyToUser: { select: publicUserSelect },
            },
        });

        return serializeComment(comment, { expandUser: true });
    }
}

// ApiBearerAuth на отдельных методах, а не на классе: иначе публичное чтение
// комментариев было бы задокументировано как требующее токена.
@ApiTags('comments')
@Controller('comments')
export class CommentsController {
    constructor(private readonly comments: CommentsService) {}

    // Читаются вместе со статьёй, поэтому тоже открыты. Оставить их за входом
    // означало бы показывать гостю статью с пустым обсуждением.
    @ApiOperation({ summary: 'Комментарии статьи' })
    @ApiOkResponse({ type: [CommentWithUserDto] })
    @Public()
    @Get()
    findMany(@Query(new ZodValidationPipe(findCommentsQuerySchema)) query: FindCommentsQuery) {
        return this.comments.findMany(query);
    }

    @ApiOperation({
        summary: 'Оставить комментарий',
        description:
            'Автор берётся из токена; userId в теле игнорируется. С parentId — ответ; схлопывается до корневого комментария, replyToUserId выставляется сервером.',
    })
    @ApiBearerAuth()
    @ApiBody({ type: CreateCommentBodyDto })
    @ApiCreatedResponse({ type: CommentWithUserDto })
    @ApiNotFoundResponse({ description: 'Статья или родительский комментарий не найдены' })
    @ApiBadRequestResponse({ description: 'Родительский комментарий из другой статьи' })
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body(new ZodValidationPipe(createCommentSchema)) dto: CreateCommentDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.comments.create(dto, user.id);
    }
}

@Module({
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
