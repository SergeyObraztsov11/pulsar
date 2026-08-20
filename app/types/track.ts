/**
 * Трек из GET /api/tracks (list).
 */
import type { Genre } from "./genre";
import type { PublicUser } from "./publicUser";

/** Краткий альбом во вложении трека */
export type TrackAlbum = {
  id: string;
  name: string;
  coverSrc: string | null;
  coverColor: string | null;
};

export type Track = {
  id: string;
  albumId: string;
  artistId: string;
  name: string;
  trackNumber: number;
  durationSec: number;
  audioSrc: string | null;
  isExplicit: boolean;
  createdAt: string;
  artist: PublicUser;
  album: TrackAlbum;
  genres: Genre[];
  isLiked: boolean;
};
