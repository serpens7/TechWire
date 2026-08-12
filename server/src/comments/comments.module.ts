import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { optionalString } from '../common/validation/query';
import { publicUserSelect, serializeComment } from '../common/serialization/serializers';

const findCommentsQuerySchema = z.object({
    articleId: optionalString,
    _expand: optionalString,
});

type FindCommentsQuery = z.infer<typeof findCommentsQuerySchema>;

@Injectable()
export class CommentsService {
    constructor(private readonly prisma: PrismaService) {}

    async findMany(query: FindCommentsQuery) {
        const expandUser = query._expand === 'user';

        const comments = await this.prisma.comment.findMany({
            where: query.articleId ? { articleId: query.articleId } : {},
            ...(expandUser ? { include: { user: { select: publicUserSelect } } } : {}),
        });

        return comments.map((comment) => serializeComment(comment, { expandUser }));
    }
}

@Controller('comments')
export class CommentsController {
    constructor(private readonly comments: CommentsService) {}

    @Get()
    findMany(@Query(new ZodValidationPipe(findCommentsQuerySchema)) query: FindCommentsQuery) {
        return this.comments.findMany(query);
    }
}

@Module({
    controllers: [CommentsController],
    providers: [CommentsService],
})
export class CommentsModule {}
