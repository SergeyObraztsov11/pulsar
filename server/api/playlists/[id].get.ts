import { getAuthUserId } from "../../utils/getAuthUserId";
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
    throw createError({ statusCode: 400, statusMessage: "Playlist id is required" });
  }

  const userId = getAuthUserId(event);

  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: { _count: { select: { tracks: true } } },
  });

  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: "Playlist not found" });
  }

  if (!playlist.isPublic && playlist.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const [trackRows, likedTrackIds] = await Promise.all([
    isLikedTracksPlaylist(playlist.systemKind)
      ? fetchPlaylistTracksByAddedAt(id)
      : fetchPlaylistTracks(id),
    getLikedTrackIdSet(userId),
  ]);

  return serializePlaylistDetail(playlist, trackRows, likedTrackIds);
});
