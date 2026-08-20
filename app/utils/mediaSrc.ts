/**
 * Ключ объекта в бакете → URL отдачи через /api/media.
 * Готовые ссылки и пути из public оставляю как есть.
 */
export function toMediaSrc(src?: string | null) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
  return `/api/media/${src}`;
}
