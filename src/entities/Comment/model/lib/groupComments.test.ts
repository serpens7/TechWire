import { groupComments } from './groupComments';
import { Comment } from '../types/comment';

const user = { id: '1', username: 'admin' };
const otherUser = { id: '2', username: 'user2' };

const makeComment = (overrides: Partial<Comment>): Comment => ({
    id: '1',
    user,
    text: 'text',
    ...overrides,
});

describe('groupComments.test', () => {
    test('комментарии без ответов — каждый свой корень с пустыми replies', () => {
        const comments = [
            makeComment({ id: '1', text: 'first' }),
            makeComment({ id: '2', text: 'second' }),
        ];

        expect(groupComments(comments)).toEqual([
            { root: comments[0], replies: [] },
            { root: comments[1], replies: [] },
        ]);
    });

    test('ответ группируется под своим корнем', () => {
        const root = makeComment({ id: '1', text: 'root' });
        const reply = makeComment({
            id: '2',
            text: 'reply',
            parentId: '1',
            user: otherUser,
            replyToUser: user,
        });

        expect(groupComments([root, reply])).toEqual([{ root, replies: [reply] }]);
    });

    test('несколько ответов на один корень сохраняют порядок', () => {
        const root = makeComment({ id: '1' });
        const reply1 = makeComment({ id: '2', parentId: '1', text: 'a' });
        const reply2 = makeComment({ id: '3', parentId: '1', text: 'b' });

        expect(groupComments([root, reply1, reply2])).toEqual([
            { root, replies: [reply1, reply2] },
        ]);
    });

    test('ответ на несуществующий корень отбрасывается', () => {
        const orphan = makeComment({ id: '1', parentId: 'нет-такого' });

        expect(groupComments([orphan])).toEqual([]);
    });

    test('пустой массив — пустой результат', () => {
        expect(groupComments([])).toEqual([]);
    });
});
