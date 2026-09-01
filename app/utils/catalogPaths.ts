/**
 * catalogPaths — URL страниц каталога: артист, альбом, трек, плейлист.
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { PlaylistSummary } from "~/types/playlist";
import type { Track } from "~/types/track";

export function trackPath(track: Track) {
  return `/user/${track.artist.id}/album/${track.album.id}/track/${track.id}`;
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
