/**
 * Общая пагинация list-эндпоинтов: albums / tracks / artists.
 * Query: limit (1…50, default 20), offset (≥0, default 0).
 */

export const LIST_LIMIT_DEFAULT = 20;
export const LIST_LIMIT_MAX = 50;

export type ListPaging = {
  limit: number;
  offset: number;
};

export type ListPage<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

/** Читает limit/offset из query; невалидные значения → дефолты / clamp */
export function parseListPaging(query: Record<string, unknown>): ListPaging {
  const limitRaw = Number(query.limit);
  const offsetRaw = Number(query.offset);

  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(Math.floor(limitRaw), LIST_LIMIT_MAX)
      : LIST_LIMIT_DEFAULT;

  const offset =
    Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;

  return { limit, offset };
}

/** Собирает ответ list API */
export function listPage<T>(
  items: T[],
  total: number,
  paging: ListPaging,
): ListPage<T> {
  return {
    items,
    total,
    limit: paging.limit,
    offset: paging.offset,
  };
}
