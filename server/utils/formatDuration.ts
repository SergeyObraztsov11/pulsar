/**
 * Секунды → строка m:ss для UI.
 */
export function formatDuration(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
