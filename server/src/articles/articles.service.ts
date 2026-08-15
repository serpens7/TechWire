import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    parseRuDate,
    publicUserSelect,
    serializeArticle,
} from '../common/serialization/serializers';
import type { ArticleBody } from './dto/article-body.dto';
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
            userId,
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
                // Статьи одного автора — страница /users/:id.
                ...(userId ? { userId } : {}),
            },
            orderBy: { [sort]: order },
            skip: (page - 1) * limit,
            take: limit,
            ...(expandUser ? { include: { user: { select: publicUserSelect } } } : {}),
        });

        return articles.map((article) => serializeArticle(article, { expandUser }));
    }

    async findOne(id: string, params: FindArticleParams, viewerId?: string) {
        const expandUser = params._expand === 'user';

        const article = await this.prisma.article.findUnique({
            where: { id },
            ...(expandUser ? { include: { user: { select: publicUserSelect } } } : {}),
        });

        if (!article) {
            throw new NotFoundException(`Статья ${id} не найдена`);
        }

        const views = await this.registerView(article.id, article.userId, viewerId);

        return serializeArticle({ ...article, views }, { expandUser });
    }

    /**
     * Засчитывает просмотр и возвращает актуальное число просмотров.
     *
     * Не считает просмотр автору собственной статьи — иначе автор,
     * просто открывающий свой черновик, накручивал бы себе счётчик.
     * Ошибка записи не должна ронять чтение статьи: счётчик — не то, ради
     * чего люди читают статьи, поэтому она проглатывается, а не пробрасывается.
     */
    private async registerView(
        articleId: string,
        authorId: string,
        viewerId?: string,
    ): Promise<number> {
        if (viewerId && viewerId === authorId) {
            const current = await this.prisma.article.findUnique({
                where: { id: articleId },
                select: { views: true },
            });

            return current?.views ?? 0;
        }

        try {
            const [updated] = await this.prisma.$transaction([
                this.prisma.article.update({
                    where: { id: articleId },
                    data: { views: { increment: 1 } },
                    select: { views: true },
                }),
                this.prisma.articleView.create({
                    data: { articleId, userId: viewerId },
                }),
            ]);

            return updated.views;
        } catch {
            const current = await this.prisma.article.findUnique({
                where: { id: articleId },
                select: { views: true },
            });

            return current?.views ?? 0;
        }
    }

    async create(body: ArticleBody, authorId: string) {
        const article = await this.prisma.article.create({
            data: {
                ...this.toWriteData(body),
                // Новая статья начинает с нуля просмотров независимо от того,
                // что прислано в теле — тело всё равно то же самое, что фронт
                // получает на GET (см. ArticleFormData), а не то, что вводит
                // пользователь.
                views: 0,
                // Автор — тот, кто авторизован. userId из тела игнорируется:
                // иначе можно было бы опубликовать статью от чужого имени.
                userId: authorId,
            },
        });

        return serializeArticle(article);
    }

    async update(id: string, body: ArticleBody) {
        const existing = await this.prisma.article.findUnique({ where: { id } });

        if (!existing) {
            throw new NotFoundException(`Статья ${id} не найдена`);
        }

        const article = await this.prisma.article.update({
            where: { id },
            // Автора при правке не меняем — статья остаётся за тем, кто её
            // создал. views тоже не трогаем: раньше сюда попадало
            // body.views ?? 0, и правка статьи без явного views в теле
            // обнуляла реальный счётчик просмотров.
            data: this.toWriteData(body),
        });

        return serializeArticle(article);
    }

    /**
     * Общая часть create/update: приведение тела запроса к колонкам таблицы.
     * Views сюда намеренно не входит — create и update решают его судьбу
     * по-разному (см. выше), и общая функция не должна это скрывать.
     */
    private toWriteData(body: ArticleBody) {
        return {
            title: body.title,
            subtitle: body.subtitle,
            img: body.img,
            type: body.type,
            blocks: body.blocks,
            createdAt: body.createdAt ? parseRuDate(body.createdAt) : new Date(),
        };
    }
}
