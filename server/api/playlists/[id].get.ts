import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";
import {
  fetchPlaylistTracks,
  serializePlaylistDetail,
} from "../../utils/playlistDetail";

/**
 * GET /api/playlists/:id — playlist meta + tracks (порядок по position)
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.PLAYLIST_ID_REQUIRED);
  }

  const userId = getAuthUserId(event);

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: { _count: { select: { tracks: true } } },
  });

  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }

  if (!playlist.isPublic && playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.PRIVATE_PLAYLIST);
  }

  const [trackRows, likedTrackIds] = await Promise.all([
    fetchPlaylistTracks(id),
    getLikedTrackIdSet(userId),
  ]);

  return serializePlaylistDetail(playlist, trackRows, likedTrackIds);
});
