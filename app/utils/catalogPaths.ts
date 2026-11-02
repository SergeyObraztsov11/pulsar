/**
 * catalogPaths — URL страниц каталога: артист, альбом, плейлист.
 * Отдельной страницы трека нет — trackPath ведёт на альбом.
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { PlaylistSummary } from "~/types/playlist";
import type { Track } from "~/types/track";

/** Альбом трека (страницы трека нет) */
export function trackPath(track: Track) {
  return `/user/${track.artist.id}/album/${track.album.id}`;
}

export function albumPath(album: Album) {
  return `/user/${album.artist.id}/album/${album.id}`;
}

export function artistPath(artist: Artist) {
  return `/user/${artist.id}`;
}

export function playlistsPath(userId: string) {
  return `/user/${userId}/playlist`;
}

export function playlistPath(playlist: Pick<PlaylistSummary, "id" | "userId">) {
  return `/user/${playlist.userId}/playlist/${playlist.id}`;
}
