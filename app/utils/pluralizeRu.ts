/**
 * pluralizeRu — склонение русских слов по числу.
 * Страницы альбома/артиста, модалки, подписи «N треков / ссылок».
 */
export function pluralizeRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** «5 треков», «1 трек» — число + слово в нужной форме */
export function formatCountRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  return pluralizeRu(
    count,
    `${count} ${one}`,
    `${count} ${few}`,
    `${count} ${many}`,
  );
}
