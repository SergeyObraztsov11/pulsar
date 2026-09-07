/**
 * Общий тип профиля после PATCH /api/auth/me (ответ модалок настроек).
 */
export type MeSettingsUser = {
  id: string;
  email: string;
  name: string;
  avatarSrc: string | null;
  avatarColor: string | null;
  bio: string | null;
  country: string | null;
  birthDate: string | null;
  gender: string | null;
};
