/**
 * DELETE /api/albums/:id — удалить свой альбом целиком.
 * Сначала файлы в MinIO (обложка + mp3 треков), затем строка в БД
 * (треки, лайки, жанры — каскадом).
 */
import { deleteS3Object } from "../../utils/s3";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/** Ключ в бакете, не публичный путь вроде /covers/c1.jpg */
function isObjectKey(src: string | null | undefined): src is string {
  return Boolean(src) && !src.startsWith("/") && !src.startsWith("http");
}

export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ALBUM_ID_REQUIRED);
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
    throwApiError(404, ApiErrorCode.ALBUM_NOT_FOUND);
  }

  if (album.artistId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }

  const keys = [
    album.coverSrc,
    ...album.tracks.map((track) => track.audioSrc),
  ].filter(isObjectKey);

  await Promise.allSettled(keys.map((key) => deleteS3Object(key)));
  await prisma.album.delete({ where: { id: album.id } });

  return { ok: true };
});
