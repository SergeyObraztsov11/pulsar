import { requireAuthUserId } from "../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../utils/likedPlaylist";

/**
 * DELETE /api/playlists/:id — user playlists only
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Playlist id is required" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: "Playlist not found" });
  }
  if (playlist.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  if (isLikedTracksPlaylist(playlist.systemKind)) {
    throw createError({
      statusCode: 400,
      statusMessage: "System playlist cannot be deleted",
    });
  }

  await prisma.playlist.delete({ where: { id } });

  return { ok: true };
});
