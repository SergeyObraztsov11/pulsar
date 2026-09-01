import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../../utils/likedPlaylist";
import { touchPlaylistUpdatedAt } from "../../../utils/touchPlaylistUpdatedAt";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/playlists/:id/tracks — add track to playlist
 * Body: { trackId: string }
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const playlistId = getRouterParam(event, "id");
  if (!playlistId) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  const body = await readBody<{ trackId?: string }>(event);
  const trackId = body.trackId?.trim();
  if (!trackId) {
    throwApiError(400, ApiErrorCode.PLAYLIST_TRACK_ID_REQUIRED);
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }
  if (playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true },
  });
  if (!track) {
    throwApiError(404, ApiErrorCode.TRACK_NOT_FOUND);
  }

  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
  });
  if (existing) {
    return { ok: true, added: false };
  }

  if (isLikedTracksPlaylist(playlist.systemKind)) {
    const last = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.$transaction(async (tx) => {
      await tx.playlistTrack.create({
        data: {
          playlistId,
          trackId,
          position: last ? last.position + 1 : 0,
        },
      });
      await touchPlaylistUpdatedAt(playlistId, tx);
    });
  } else {
    const last = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = last ? last.position + 1 : 0;
    await prisma.$transaction(async (tx) => {
      await tx.playlistTrack.create({
        data: { playlistId, trackId, position },
      });
      await touchPlaylistUpdatedAt(playlistId, tx);
    });
  }

  return { ok: true, added: true };
});
