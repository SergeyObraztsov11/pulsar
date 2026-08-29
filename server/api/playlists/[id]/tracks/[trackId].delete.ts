import { requireAuthUserId } from "../../../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../../../utils/likedPlaylist";
import { compactPlaylistPositionsAfterDelete } from "../../../../utils/playlistPosition";

/**
 * DELETE /api/playlists/:id/tracks/:trackId — remove track from playlist
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const playlistId = getRouterParam(event, "id");
  const trackId = getRouterParam(event, "trackId");
  if (!playlistId || !trackId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Playlist id and track id are required",
    });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: "Playlist not found" });
  }
  if (playlist.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
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
  });

  return { ok: true, removed: true };
});
