/**
 * Публичные поля пользователя (без email и passwordHash).
 */
export const publicUserSelect = {
  id: true,
  name: true,
  avatarSrc: true,
  bio: true,
  country: true,
} as const;
