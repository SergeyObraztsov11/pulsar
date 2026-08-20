/**
 * DELETE /api/albums/:id — удалить свой альбом целиком.
 * Сначала файлы в MinIO (обложка + mp3 треков), затем строка в БД
 * (треки, лайки, жанры — каскадом).
 */
import { deleteS3Object } from "../../utils/s3";

/** Ключ в бакете, не публичный путь вроде /covers/c1.jpg */
function isObjectKey(src: string | null | undefined): src is string {
  return Boolean(src) && !src.startsWith("/") && !src.startsWith("http");
}

export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Album id is required" });
  }

  const album = await prisma.album.findUnique({
    where: { id },
    select: {
      id: true,
      artistId: true,
      coverSrc: true,
      tracks: { select: { audioSrc: true } },
    },
  });

  if (!album) {
    throw createError({ statusCode: 404, statusMessage: "Album not found" });
  }

  if (album.artistId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const keys = [
    album.coverSrc,
    ...album.tracks.map((track) => track.audioSrc),
  ].filter(isObjectKey);

  await Promise.allSettled(keys.map((key) => deleteS3Object(key)));
  await prisma.album.delete({ where: { id: album.id } });

  return { ok: true };
});
