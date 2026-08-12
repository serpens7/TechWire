import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
} from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { ArticlesService } from './articles.service';
import { articleBodySchema, type ArticleBody } from './dto/article-body.dto';
import {
    findArticleParamsSchema,
    findArticlesQuerySchema,
    type FindArticleParams,
    type FindArticlesQuery,
} from './dto/find-articles.query';

@Controller('articles')
export class ArticlesController {
    constructor(private readonly articles: ArticlesService) {}

    @Get()
    findMany(@Query(new ZodValidationPipe(findArticlesQuerySchema)) query: FindArticlesQuery) {
        return this.articles.findMany(query);
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Query(new ZodValidationPipe(findArticleParamsSchema)) params: FindArticleParams,
    ) {
        return this.articles.findOne(id, params);
    }

    /**
     * Создание и правка статей — только для админов. На фронте это уже
     * ограничено (роут закрыт RequireAuth с ролями, ссылка скрыта в Navbar),
     * но там это лишь UX: настоящий запрет живёт здесь.
     */
    @Roles('ADMIN')
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body(new ZodValidationPipe(articleBodySchema)) body: ArticleBody,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        return this.articles.create(body, user.id);
    }

    @Roles('ADMIN')
    @Put(':id')
    update(
        @Param('id') id: string,
        @Body(new ZodValidationPipe(articleBodySchema)) body: ArticleBody,
    ) {
        return this.articles.update(id, body);
    }
}
