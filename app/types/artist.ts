/**
 * Артист из GET /api/artists (list) = публичный user + isLiked.
 */
import type { Album } from "./album";
import type { PublicUser } from "./publicUser";
import type { Track } from "./track";

export type Artist = PublicUser & {
  isLiked: boolean;
};

/** Внешние ссылки артиста (стриминг / соцсети) */
export type ArtistLinkKind =
  | "spotify"
  | "appleMusic"
  | "yandexMusic"
  | "instagram"
  | "telegram"
  | "youtube"
  | "tiktok"
  | "vk";

export type ArtistLink = {
  kind: ArtistLinkKind;
  href: string;
};

/** Артист из GET /api/artists/:id — с альбомами, треками и счётчиками */
export type ArtistDetail = Artist & {
  /** Слушатели (пока демо, без аналитики) */
  listenersCount: number;
  /** Внешние ссылки (пока демо; позже — из профиля) */
  links: ArtistLink[];
  albumCount: number;
  trackCount: number;
  totalDurationSec: number;
  albums: Album[];
  tracks: Track[];
};
