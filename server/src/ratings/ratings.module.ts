import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optionalString } from '../common/validation/query';
import { serializeRating } from '../common/serialization/serializers';

const findRatingsQuerySchema = z.object({
    userId: optionalString,
    articleId: optionalString,
});

type FindRatingsQuery = z.infer<typeof findRatingsQuerySchema>;

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
}

@Module({
    controllers: [RatingsController],
    providers: [RatingsService],
})
export class RatingsModule {}
