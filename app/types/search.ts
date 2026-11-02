/**
 * Типы поиска и ответ GET /api/search.
 */
import type { Album } from "./album";
import type { Artist } from "./artist";
import type { Track } from "./track";

/** Фильтр типа на /search (без type в URL = «Все») */
export type SearchType = "artists" | "tracks" | "albums";

/** Значение чипа: пустая строка = «Все» */
export type SearchTypeFilter = SearchType | "";

/** Чипы: «Все» = пустой value */
export const SEARCH_TYPE_OPTIONS: {
  value: SearchTypeFilter;
  label: string;
}[] = [
  { value: "", label: "Все" },
  { value: "artists", label: "Исполнители" },
  { value: "tracks", label: "Треки" },
  { value: "albums", label: "Альбомы" },
];

/** type из query; неизвестное / пусто → undefined («Все») */
export function parseSearchType(value: unknown): SearchType | undefined {
  if (value === "artists" || value === "tracks" || value === "albums") {
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
