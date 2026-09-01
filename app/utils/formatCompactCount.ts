/**
 * formatCompactCount — сокращённый формат больших чисел для UI.
 * Лайки, слушатели, счётчики.
 *
 * | n              | Пример     |
 * |----------------|------------|
 * | 0 – 999        | 999        |
 * | 1 000 – 999 999| 1,2 тыс    |
 * | 1 000 000+     | 1,2 млн    |
 * | 1 000 000 000+ | 1,2 млрд   |
 *
 * Дробная часть — запятая; максимум одна цифра после запятой.
 */
function formatUnitValue(value: number): string {
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return String(Math.round(value));

  const floored = Math.floor(value * 10) / 10;
  if (Number.isInteger(floored)) return String(floored);

  return floored.toFixed(1).replace(".", ",").replace(/,0$/, "");
}

export function formatCompactCount(count: number): string {
  const n = Math.max(0, Math.floor(count));

  if (n < 1_000) return n.toLocaleString("ru-RU");
  if (n < 1_000_000) return `${formatUnitValue(n / 1_000)} тыс`;
  if (n < 1_000_000_000) return `${formatUnitValue(n / 1_000_000)} млн`;

  return `${formatUnitValue(n / 1_000_000_000)} млрд`;
}
