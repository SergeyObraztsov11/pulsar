/**
 * Общий sort/order для list API: albums / tracks / artists.
 *
 * Query:
 * - sort — createdAt | name | likedAt | likes | plays
 * - order — asc | desc (если нет — default для sort)
 */

export const LIST_SORT_VALUES = [
  "createdAt",
  "name",
  "likedAt",
  "likes",
  "plays",
] as const;

export type ListSort = (typeof LIST_SORT_VALUES)[number];
export type ListOrder = "asc" | "desc";

const DEFAULT_ORDER: Record<ListSort, ListOrder> = {
  createdAt: "desc",
  name: "asc",
  likedAt: "desc",
  likes: "desc",
  plays: "desc",
};

export function parseListSort(
  query: Record<string, unknown>,
  defaultSort: ListSort,
): { sort: ListSort; order: ListOrder } {
  const sortRaw = typeof query.sort === "string" ? query.sort : defaultSort;
  const sort = LIST_SORT_VALUES.includes(sortRaw as ListSort)
    ? (sortRaw as ListSort)
    : defaultSort;

  const orderRaw = typeof query.order === "string" ? query.order : "";
  const order: ListOrder =
    orderRaw === "asc" || orderRaw === "desc"
      ? orderRaw
      : DEFAULT_ORDER[sort];

  return { sort, order };
}
