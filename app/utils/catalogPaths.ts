/**
 * Пути к сущностям каталога.
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Track } from "~/types/track";

/** Страница трека */
export function trackPath(track: Track) {
  return `/user/${track.artist.id}/album/${track.album.id}/track/${track.id}`;
}

/** Страница альбома */
export function albumPath(album: Album) {
  return `/user/${album.artist.id}/album/${album.id}`;
}

/** Страница исполнителя */
export function artistPath(artist: Artist) {
  return `/user/${artist.id}`;
}
