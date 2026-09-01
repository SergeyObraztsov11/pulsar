import { requireAuthUserId } from "../../../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../../../utils/likedPlaylist";
import { compactPlaylistPositionsAfterDelete } from "../../../../utils/playlistPosition";
import { touchPlaylistUpdatedAt } from "../../../../utils/touchPlaylistUpdatedAt";
import { ApiErrorCode, throwApiError } from "../../../../utils/apiError";

/**
 * DELETE /api/playlists/:id/tracks/:trackId — remove track from playlist
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const playlistId = getRouterParam(event, "id");
  const trackId = getRouterParam(event, "trackId");
  if (!playlistId || !trackId) {
    throwApiError(400, ApiErrorCode.PLAYLIST_TRACK_ID_REQUIRED);
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }
  if (playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }

  const removed = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
    select: { position: true },
  });
  if (!removed) {
    return { ok: true, removed: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.delete({
      where: { playlistId_trackId: { playlistId, trackId } },
    });

    if (!isLikedTracksPlaylist(playlist.systemKind)) {
      await compactPlaylistPositionsAfterDelete(tx, playlistId, removed.position);
    }

    await touchPlaylistUpdatedAt(playlistId, tx);
  });

  return { ok: true, removed: true };
});
