import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";
import { movePlaylistTrack } from "../../../utils/playlistPosition";
import { touchPlaylistUpdatedAt } from "../../../utils/touchPlaylistUpdatedAt";

/**
 * PATCH /api/playlists/:id/tracks — переставить один трек.
 * Body: { trackId: string, toPosition: number } (0-based индекс в списке).
 * Владелец; «Любимые» тоже. Очередь плеера не трогаем (клиент).
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const playlistId = getRouterParam(event, "id");
  if (!playlistId) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  const body = await readBody<{ trackId?: string; toPosition?: number }>(event);
  const trackId = body.trackId?.trim();
  if (!trackId) {
    throwApiError(400, ApiErrorCode.PLAYLIST_TRACK_ID_REQUIRED);
  }

  const toPosition = body.toPosition;
  if (
    typeof toPosition !== "number" ||
    !Number.isInteger(toPosition) ||
    toPosition < 0
  ) {
    throwApiError(400, ApiErrorCode.PLAYLIST_POSITION_INVALID);
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { id: true, userId: true },
  });
  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }
  if (playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }

  const row = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
    select: { trackId: true },
  });
  if (!row) {
    throwApiError(404, ApiErrorCode.PLAYLIST_TRACK_NOT_FOUND);
  }

  const count = await prisma.playlistTrack.count({ where: { playlistId } });
  if (toPosition >= count) {
    throwApiError(400, ApiErrorCode.PLAYLIST_POSITION_INVALID);
  }

  await prisma.$transaction(async (tx) => {
    await movePlaylistTrack(tx, playlistId, trackId, toPosition);
    await touchPlaylistUpdatedAt(playlistId, tx);
  });

  return { ok: true, moved: true };
});
