import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import {
  getLikedTrackIdSet,
  isLikedTracksPlaylist,
} from "../../utils/likedPlaylist";
import {
  fetchPlaylistTracks,
  fetchPlaylistTracksByAddedAt,
  serializePlaylistDetail,
} from "../../utils/playlistDetail";

/**
 * GET /api/playlists/:id — playlist meta + tracks
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
    isLikedTracksPlaylist(playlist.systemKind)
      ? fetchPlaylistTracksByAddedAt(id)
      : fetchPlaylistTracks(id),
    getLikedTrackIdSet(userId),
  ]);

  return serializePlaylistDetail(playlist, trackRows, likedTrackIds);
});
