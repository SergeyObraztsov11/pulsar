/**
 * Публичный пользователь в ответах API (без email / passwordHash).
 */
export type PublicUser = {
  id: string;
  name: string;
  avatarSrc: string | null;
  /** Accent hex для hero (`#rrggbb`) */
  avatarColor: string | null;
  bio: string | null;
  country: string | null;
};
