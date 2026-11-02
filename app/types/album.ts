/**
 * Альбом из GET /api/albums (list item).
 * List: GET /api/albums → ListPage<Album>
 */
import type { Genre } from "./genre";
import type { PublicUser } from "./publicUser";
import type { Track } from "./track";

export type Album = {
  id: string;
  artistId: string;
  name: string;
  coverSrc: string | null;
  /** Dominant с обложки, `#rrggbb`; без обложки — null */
  coverColor: string | null;
  releaseDate: string | null;
  /** Хотя бы один трек с isExplicit */
  isExplicit: boolean;
  createdAt: string;
  artist: PublicUser;
  genres: Genre[];
  isLiked: boolean;
};

/** Альбом из GET /api/albums/:id — с треклистом и счётчиками */
export type AlbumDetail = Album & {
  likesCount: number;
  /** Уникальные пользователи с listen по трекам альбома */
  listenersCount: number;
  trackCount: number;
  totalDurationSec: number;
  tracks: Track[];
};