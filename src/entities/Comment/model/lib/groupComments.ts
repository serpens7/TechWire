import { Comment } from '../types/comment';

export interface CommentGroup {
    root: Comment;
    replies: Comment[];
}

/**
 * Раскладывает плоский массив комментариев (в порядке created At — так их
 * отдаёт сервер) в корни + их ответы. Сервер уже схлопнул вложенность до
 * одного уровня, так что группировка — просто разбор по parentId, без
 * рекурсии.
 *
 * Ответ на несуществующий (ещё не загруженный или удалённый) родитель молча
 * отбрасывается — реальная сортировка сервера этого не допускает, но
 * функция остаётся устойчивой к неполным данным (например, в сторис/тестах).
 */
export function groupComments(comments: Comment[]): CommentGroup[] {
    const roots: Comment[] = [];
    const repliesByParentId = new Map<string, Comment[]>();

    comments.forEach((comment) => {
        if (comment.parentId) {
            const replies = repliesByParentId.get(comment.parentId) ?? [];
            replies.push(comment);
            repliesByParentId.set(comment.parentId, replies);
        } else {
            roots.push(comment);
        }
    });

    return roots.map((root) => ({
        root,
        replies: repliesByParentId.get(root.id) ?? [],
    }));
}
