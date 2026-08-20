import { parseBuffer } from "music-metadata";

/**
 * Длительность из файла. Не разобралось — это не аудио, 400.
 * Разобралось, но секунд нет — 0.
 */
export async function durationSecFromAudio(data: Buffer) {
  try {
    const meta = await parseBuffer(data);
    const sec = meta.format.duration;
    if (sec == null || !Number.isFinite(sec) || sec < 0) return 0;
    return Math.round(sec);
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "audio must be a valid audio file",
    });
  }
}
