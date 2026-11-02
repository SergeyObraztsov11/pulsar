/**
 * Suggest шапки: словарные запросы + сущности (артисты / альбомы / треки).
 */
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { Track } from "~/types/track";
import { albumPath, artistPath, trackPath } from "~/utils/catalogPaths";

/** Сколько словарных строк сверху */
const QUERY_LIMIT = 3;

export type SearchSuggestQueryItem = {
  kind: "query";
  id: string;
  title: string;
  to: { path: string; query: { q: string } };
};

export type SearchSuggestArtistItem = {
  kind: "artist";
  id: string;
  artist: Artist;
  to: string;
};

export type SearchSuggestAlbumItem = {
  kind: "album";
  id: string;
  album: Album;
  to: string;
};

export type SearchSuggestTrackItem = {
  kind: "track";
  id: string;
  track: Track;
  to: string;
};

export type SearchSuggestItem =
  | SearchSuggestQueryItem
  | SearchSuggestArtistItem
  | SearchSuggestAlbumItem
  | SearchSuggestTrackItem;

/**
 * Словарные запросы: только названия, где есть query;
 * порядок артисты → альбомы → треки (исполнитель не вытесняется треками).
 */
export function buildSearchDictionary(opts: {
  query: string;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}): SearchSuggestQueryItem[] {
  const needle = opts.query.trim().toLocaleLowerCase("ru");
  const seen = new Set<string>();
  const rows: { key: string; title: string }[] = [];

  function add(title: string) {
    const trimmed = title.trim();
    if (!trimmed) return;
    const key = trimmed.toLocaleLowerCase("ru");
    if (needle && !key.includes(needle)) return;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ key, title: trimmed });
  }

  for (const artist of opts.artists) add(artist.name);
  for (const album of opts.albums) add(album.name);
  for (const track of opts.tracks) add(track.name);

  return rows.slice(0, QUERY_LIMIT).map((row) => ({
    kind: "query" as const,
    id: `query:${row.key}`,
    title: row.title,
    to: {
      path: "/search",
      query: { q: row.title },
    },
  }));
}

/**
 * Плоский список для панели и клавиатуры:
 * запросы → артисты → альбомы → треки.
 */
export function buildSearchSuggestItems(opts: {
  query: string;
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
}): SearchSuggestItem[] {
  const items: SearchSuggestItem[] = [...buildSearchDictionary(opts)];
  for (const artist of opts.artists) {
    items.push({
      kind: "artist",
      id: `artist:${artist.id}`,
      artist,
      to: artistPath(artist),
    });
  }

  for (const album of opts.albums) {
    items.push({
      kind: "album",
      id: `album:${album.id}`,
      album,
      to: albumPath(album),
    });
  }

  for (const track of opts.tracks) {
    items.push({
      kind: "track",
      id: `track:${track.id}`,
      track,
      to: trackPath(track),
    });
  }

  return items;
}

/** Текст для поля поиска по пункту suggest */
export function suggestItemTitle(item: SearchSuggestItem): string {
  if (item.kind === "query") return item.title;
  if (item.kind === "artist") return item.artist.name;
  if (item.kind === "album") return item.album.name;
  return item.track.name;
}

/** Разбить title для подсветки вхождения query */
export function splitQueryHighlight(title: string, query: string) {
  const q = query.trim();
  if (!q) {
    return { before: title, match: "", after: "" };
  }

  const lowerTitle = title.toLocaleLowerCase("ru");
  const lowerQuery = q.toLocaleLowerCase("ru");
  const index = lowerTitle.indexOf(lowerQuery);
  if (index < 0) {
    return { before: title, match: "", after: "" };
  }

  return {
    before: title.slice(0, index),
    match: title.slice(index, index + q.length),
    after: title.slice(index + q.length),
  };
}
