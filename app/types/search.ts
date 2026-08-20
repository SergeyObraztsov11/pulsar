/**
 * Типы поиска и ответ GET /api/search.
 */
import type { Album } from "./album";
import type { Artist } from "./artist";
import type { Track } from "./track";

/** Фильтр типа на странице /search (без выбора = undefined) */
export type SearchType = "tracks" | "albums" | "playlists";

export const SEARCH_TYPE_OPTIONS: { value: SearchType; label: string }[] = [
  { value: "tracks", label: "Треки" },
  { value: "albums", label: "Альбомы" },
  { value: "playlists", label: "Плейлисты" },
];

/** type из query; неизвестное / пусто → undefined */
export function parseSearchType(value: unknown): SearchType | undefined {
  if (
    value === "tracks" ||
    value === "albums" ||
    value === "playlists"
  ) {
    return value;
  }
  return undefined;
}

/** genre id из query */
export function parseSearchGenre(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Query для /search: q, type, genre (пустые не пишем) */
export function buildSearchQuery(opts: {
  q?: string;
  type?: SearchType;
  genre?: string;
}) {
  return {
    ...(opts.q ? { q: opts.q } : {}),
    ...(opts.type ? { type: opts.type } : {}),
    ...(opts.genre ? { genre: opts.genre } : {}),
  };
}

export type SearchSuggest = {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
};
