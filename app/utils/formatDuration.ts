/**
 * formatDuration — длинная длительность по-русски для альбомов и мета-блоков.
 * Пример: 270 → «4 мин, 30 сек»; 0 → null.
 */
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function formatDurationRu(totalSec: number): string | null {
  if (totalSec <= 0) return null;

  const value = dayjs.duration(totalSec, "seconds");
  const hours = Math.floor(value.asHours());
  const minutes = value.minutes();
  const seconds = value.seconds();

  const parts: string[] = [];
  if (hours) parts.push(`${hours} час`);
  if (minutes || hours) parts.push(`${minutes} мин`);
  if (seconds || parts.length === 0) parts.push(`${seconds} сек`);
  return parts.join(", ");
}
