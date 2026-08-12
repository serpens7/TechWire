/**
 * Сверка типов фронта со схемой бэкенда.
 *
 * Типы сущностей во фронте написаны руками и живут в своих слайсах FSD.
 * Заменить их сгенерированными нельзя без крупного рефакторинга: значения
 * вроде `ArticleType.IT` используются как значения, а не только как типы, а
 * сам `ArticleType` вдобавок содержит `ALL`, которого на сервере нет вовсе —
 * это значение фильтра, а не тип статьи.
 *
 * Поэтому дублирование не устранено, а поставлено под контроль: файл
 * утверждает, что данные, описанные схемой сервера, подходят под типы фронта.
 * Расхождение перестаёт быть тихим — оно роняет `npm run type:check`.
 *
 * Лежит в слое app, а не рядом со схемой в shared: файл ссылается на типы
 * сущностей, а импорт из shared в entities запрещён правилами FSD (это
 * ловит steiger). app — единственный слой, которому можно смотреть на все
 * остальные.
 *
 * Ничего не экспортируется в рантайм: все проверки на уровне типов.
 * Схема пересобирается командой `npm run api:sync`.
 */
import type { Article, ArticleType } from '@/entities/Article';
import type { Comment } from '@/entities/Comment';
import type { Notification } from '@/entities/Notification';
import type { Profile } from '@/entities/Profile';
import type { User, UserRole } from '@/entities/User';
import type { components } from '@/shared/api/generated/schema';

type Schemas = components['schemas'];

/** Утверждение: условие должно быть истинным на уровне типов. */
type Assert<T extends true> = T;

/**
 * Приводит строковые enum'ы к их значениям.
 *
 * Нужно, потому что TypeScript считает `ArticleType.IT` и литерал `'IT'`
 * разными типами: enum номинален, присваивание литерала в enum запрещено.
 * По проводам же ходят обычные строки, поэтому сравнивать осмысленно именно
 * значения.
 */
type Widen<T> = T extends string ? `${T}` : T;

type DeepWiden<T> = T extends (infer U)[]
    ? DeepWiden<U>[]
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : Widen<T>;

/** Данные сервера подходят под тип фронта. */
type Fits<Server, Front> = Server extends DeepWiden<Front> ? true : false;

// --- пользователь ----------------------------------------------------------

export type _UserFits = Assert<Fits<Schemas['UserDto'], User>>;

// Роли, которые может прислать сервер, известны фронту.
export type _RolesKnown = Assert<
    Schemas['UserDto']['roles'][number] extends `${UserRole}` ? true : false
>;

// --- статья ----------------------------------------------------------------

type ServerArticle = Schemas['ArticleWithUserDto'];

export type _ArticleFits = Assert<Fits<ServerArticle, Article>>;

/**
 * Типы статей с сервера известны фронту. Обратное неверно, и это правильно:
 * ArticleType.ALL — значение фильтра «все типы», сервер его не отдаёт.
 */
export type _ArticleTypesKnown = Assert<
    ServerArticle['type'][number] extends `${ArticleType}` ? true : false
>;

export type _ArticleAuthorFits = Assert<Fits<ServerArticle['user'], User>>;

/** Ответ пути редактирования — без развёрнутого автора. */
export type _ArticleFormFits = Assert<
    Schemas['ArticleDto'] extends { id: string; userId: string } ? true : false
>;

// --- комментарий -----------------------------------------------------------

export type _CommentFits = Assert<Fits<Schemas['CommentWithUserDto'], Omit<Comment, 'user'>>>;
export type _CommentAuthorFits = Assert<Fits<Schemas['CommentWithUserDto']['user'], User>>;

// --- профиль ---------------------------------------------------------------

export type _ProfileFits = Assert<Fits<Schemas['ProfileDto'], Profile>>;

// --- уведомление -----------------------------------------------------------

export type _NotificationFits = Assert<Fits<Schemas['NotificationDto'], Notification>>;

// --- ответ на вход ---------------------------------------------------------

export type _LoginUserFits = Assert<Fits<Schemas['LoginResponseDto']['user'], User>>;
export type _LoginHasToken = Assert<Schemas['LoginResponseDto']['token'] extends string ? true : false>;
