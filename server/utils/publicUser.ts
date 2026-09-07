/**
 * Публичные поля пользователя (без email и passwordHash).
 */
export const publicUserSelect = {
  id: true,
  name: true,
  avatarSrc: true,
  avatarColor: true,
  bio: true,
  country: true,
} as const;
