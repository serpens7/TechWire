/**
 * Выбирает победителя из результата Prisma groupBy по article_views, уже
 * отсортированного по числу просмотров за окно (по убыванию). Вынесено в
 * чистую функцию, а не инлайн в HighlightsService, ради того же, ради чего
 * вынесен pickSnippetOfTheDay — дёшево проверить в отрыве от Prisma и БД.
 */
export interface ArticleViewCount {
    articleId: string;
}

export function pickArticleOfTheDayId(
    windowCounts: ArticleViewCount[] | undefined,
): string | undefined {
    return windowCounts?.[0]?.articleId;
}
