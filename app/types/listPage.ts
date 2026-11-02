/**
 * Страница списка для GET /api/albums|tracks|artists.
 */
export type ListPage<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};
