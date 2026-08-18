import type { User } from '@/entities/User/@x/Comment';

export interface Comment {
    id: string;
    user: User;
    text: string;
    /**
     * Есть только у ответа. Сервер уже схлопывает вложенность до одного
     * уровня — parentId всегда указывает на КОРНЕВОЙ комментарий, даже если
     * ответили на ответ. См. groupComments и server: CommentsService.create.
     */
    parentId?: string;
    /** Кому именно адресован ответ — источник подписи "@username". */
    replyToUser?: User;
}
