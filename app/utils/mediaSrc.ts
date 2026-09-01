/**
 * mediaSrc — ключ MinIO / путь в бакете → URL для <img> и <audio>.
 * Готовые http(s) и /public пути не трогаем.
 */
export function toMediaSrc(src?: string | null) {
  if (!src) return null;
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) return src;
  return `/api/media/${src}`;
}
