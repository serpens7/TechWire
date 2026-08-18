import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Требует у пользователя хотя бы одну из перечисленных ролей.
 *
 * Зеркалит то, что фронт уже делает в RequireAuth: там проверяется пересечение
 * route.roles и user.roles. Разница в том, что фронтовая проверка — это UX,
 * а настоящее ограничение живёт здесь.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
