import {
    Body,
    Controller,
    Get,
    Injectable,
    Module,
    NotFoundException,
    Post,
    Query,
} from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optionalString } from '../common/validation/query';
import { serializeRating } from '../common/serialization/serializers';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

const findRatingsQuerySchema = z.object({
    userId: optionalString,
    articleId: optionalString,
});

type FindRatingsQuery = z.infer<typeof findRatingsQuerySchema>;

const rateArticleSchema = z.object({
    articleId: z.string().min(1, 'Не указана статья'),
    rate: z.coerce.number().int().min(1).max(5),
    feedback: z.string().optional(),
    // Присылается фронтом, но оценка всегда записывается на владельца токена.
    userId: z.string().optional(),
});

type RateArticleDto = z.infer<typeof rateArticleSchema>;

@Injectable()
export class RatingsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMany(query: FindRatingsQuery) {
        const ratings = await this.prisma.rating.findMany({
            where: {
                ...(query.userId ? { userId: query.userId } : {}),
                ...(query.articleId ? { articleId: query.articleId } : {}),
            },
        });

        return ratings.map(serializeRating);
    }

    async rate(dto: RateArticleDto, userId: string) {
        const article = await this.prisma.article.findUnique({
            where: { id: dto.articleId },
            select: { id: true },
        });

        if (!article) {
            throw new NotFoundException(`Статья ${dto.articleId} не найдена`);
        }

        // upsert, а не create: на паре пользователь+статья стоит уникальный
        // индекс, повторная отправка должна перезаписывать оценку, а не падать.
        // json-server на это место просто плодил дубли.
        const rating = await this.prisma.rating.upsert({
            where: { userId_articleId: { userId, articleId: dto.articleId } },
            create: {
                userId,
                articleId: dto.articleId,
                rate: dto.rate,
                feedback: dto.feedback ?? null,
            },
            update: { rate: dto.rate, feedback: dto.feedback ?? null },
        });

        return serializeRating(rating);
    }
}

/**
 * Путь с дефисом — как в db.json. Фронт ждёт массив: пустой означает
 * «пользователь ещё не оценивал статью», и на этом строится выбор между
 * формой оценки и показом уже выставленной.
 */
@Controller('article-ratings')
export class RatingsController {
    constructor(private readonly ratings: RatingsService) {}

    @Get()
    findMany(@Query(new ZodValidationPipe(findRatingsQuerySchema)) query: FindRatingsQuery) {
        return this.ratings.findMany(query);
    }

    @Post()
    rate(
        @Body(new ZodValidationPipe(rateArticleSchema)) dto: RateArticleDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.ratings.rate(dto, user.id);
    }
}

@Module({
    controllers: [RatingsController],
    providers: [RatingsService],
})
export class RatingsModule {}
