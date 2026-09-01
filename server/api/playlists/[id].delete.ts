import { requireAuthUserId } from "../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../utils/likedPlaylist";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * DELETE /api/playlists/:id — user playlists only
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }
  if (playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }
  if (isLikedTracksPlaylist(playlist.systemKind)) {
    throwApiError(400, ApiErrorCode.SYSTEM_PLAYLIST_NOT_DELETABLE);
  }

  await prisma.playlist.delete({ where: { id } });

  return { ok: true };
});
