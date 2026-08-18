import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Снимает требование авторизации с конкретного маршрута.
 *
 * Гвард навешан глобально, то есть закрыто всё по умолчанию — открывать
 * приходится осознанно и точечно. Это повторяет поведение json-server, который
 * отвергал любой запрос без заголовка authorization, кроме /login.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
