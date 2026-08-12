import { Controller, Get, Param, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ArticlesService } from './articles.service';
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
}
