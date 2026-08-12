import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect, serializeArticle } from '../common/serialization/serializers';
import type { FindArticleParams, FindArticlesQuery } from './dto/find-articles.query';

const DEFAULT_LIMIT = 12;
const DEFAULT_PAGE = 1;

@Injectable()
export class ArticlesService {
    constructor(private readonly prisma: PrismaService) {}

    async findMany(query: FindArticlesQuery) {
        const {
            _limit: limit = DEFAULT_LIMIT,
            _page: page = DEFAULT_PAGE,
            _sort: sort = 'createdAt',
            _order: order = 'asc',
            q,
            type,
        } = query;

        const expandUser = query._expand === 'user';

        const articles = await this.prisma.article.findMany({
            where: {
                // ОТЛИЧИЕ ОТ json-server (осознанное, исправление дефекта):
                // type — массив, и json-server сравнивал его целиком, поэтому
                // статья с двумя типами (например ["ECONOMICS","IT"]) не
                // попадала НИ ПОД ОДИН фильтр. Таких статей 6 из 36 — они были
                // невидимы. has проверяет вхождение в массив, как и задумано.
                ...(type ? { type: { has: type } } : {}),
                // ОТЛИЧИЕ ОТ json-server (осознанное, решение по продукту):
                // json-server искал по всему содержимому записи, включая блоки
                // с кодом, из-за чего запрос "Javascript" возвращал 19 статей
                // из 36 — совпадения приходились на примеры кода. Ищем по
                // заголовку и подзаголовку: это то, что имеют в виду под
                // поиском статей.
                ...(q
                    ? {
                          OR: [
                              { title: { contains: q, mode: 'insensitive' as const } },
                              { subtitle: { contains: q, mode: 'insensitive' as const } },
                          ],
                      }
                    : {}),
            },
            orderBy: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
            ...(expandUser ? { include: { user: { select: publicUserSelect } } } : {}),
        });

        return articles.map((article) => serializeArticle(article, { expandUser }));
    }

    async findOne(id: string, params: FindArticleParams) {
        const expandUser = params._expand === 'user';

        const article = await this.prisma.article.findUnique({
            where: { id },
            ...(expandUser ? { include: { user: { select: publicUserSelect } } } : {}),
        });

        if (!article) {
            throw new NotFoundException(`Статья ${id} не найдена`);
        }

        return serializeArticle(article, { expandUser });
    }
}
