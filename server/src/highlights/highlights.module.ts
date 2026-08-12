import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';
import { formatRuDate, publicUserSelect, serializeUser } from '../common/serialization/serializers';
import { HighlightsDto, type Highlights } from '../common/serialization/schemas';
import { pickSnippetOfTheDay } from './pickSnippetOfTheDay';

/** Из скольких свежих статей выбирается сниппет дня. */
const SNIPPET_POOL_SIZE = 20;

@Injectable()
export class HighlightsService {
    constructor(private readonly prisma: PrismaService) {}

    async find(): Promise<Highlights> {
        const [mostViewed, recent] = await Promise.all([
            this.prisma.article.findFirst({
                orderBy: { views: 'desc' },
                include: { user: { select: publicUserSelect } },
            }),
            this.prisma.article.findMany({
                orderBy: { createdAt: 'desc' },
                take: SNIPPET_POOL_SIZE,
                include: { user: { select: publicUserSelect } },
            }),
        ]);

        const picked = pickSnippetOfTheDay(recent);

        return {
            // Намеренно без blocks: это тизер, а не статья.
            articleOfTheDay: mostViewed
                ? {
                      id: mostViewed.id,
                      title: mostViewed.title,
                      subtitle: mostViewed.subtitle,
                      img: mostViewed.img,
                      views: mostViewed.views,
                      createdAt: formatRuDate(mostViewed.createdAt),
                      type: mostViewed.type,
                      user: serializeUser(mostViewed.user),
                  }
                : null,
            snippetOfTheDay: picked
                ? {
                      code: picked.code,
                      article: {
                          id: picked.article.id,
                          title: picked.article.title,
                          user: serializeUser(picked.article.user),
                      },
                  }
                : null,
        };
    }
}

@ApiTags('highlights')
@Controller('highlights')
export class HighlightsController {
    constructor(private readonly highlights: HighlightsService) {}

    /**
     * Единственный эндпоинт со статьями, доступный без токена.
     *
     * Нужен, чтобы главная что-то показывала незалогиненному посетителю:
     * до этого оба блока получали 401 и страница выглядела пустой. Каталог
     * и тексты статей остаются закрытыми.
     */
    @ApiOperation({
        summary: 'Тизеры для главной',
        description:
            'Публичный маршрут. Отдаёт статью дня без содержимого и сниппет дня — по этим данным статью не прочитать.',
    })
    @ApiOkResponse({ type: HighlightsDto })
    @Public()
    @Get()
    find() {
        return this.highlights.find();
    }
}

@Module({
    controllers: [HighlightsController],
    providers: [HighlightsService],
})
export class HighlightsModule {}
