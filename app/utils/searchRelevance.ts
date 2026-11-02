/**
 * Релевантность строки поиска к названию (выше = лучше).
 * exact → startsWith → contains; короче имя и раньше вхождение — выше.
 */
export function scoreSearchMatch(name: string, query: string): number {
  const n = name.trim().toLocaleLowerCase("ru");
  const q = query.trim().toLocaleLowerCase("ru");
  if (!q || !n) return -1;

  if (n === q) return 10_000;

  if (n.startsWith(q)) {
    return 8_000 - Math.min(n.length, 500);
  }

  const index = n.indexOf(q);
  if (index >= 0) {
    return 5_000 - index * 10 - Math.min(n.length, 500);
  }

  return -1;
}

/** Лучший score по нескольким полям (имя / артист / альбом) */
export function scoreSearchFields(query: string, ...names: string[]): number {
  let best = -1;
  for (const name of names) {
    best = Math.max(best, scoreSearchMatch(name, query));
  }
  return best;
}
