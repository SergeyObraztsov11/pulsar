/**
 * formatTime — короткая длительность mm:ss для плеера и карточек треков.
 * Пример: 245 → «4:05».
 */
export function formatTimeMmSs(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}
