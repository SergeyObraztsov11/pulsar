import { getOrCreateLikedPlaylist, isLikedTracksPlaylist } from "../../utils/likedPlaylist";
import { requireAuthUserId } from "../../utils/getAuthUserId";
import { serializePlaylistSummary } from "../../utils/playlistDetail";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";

/**
 * GET /api/playlists — current user's playlists (incl. system «Любимые»)
 * Query: trackId — if set, each item includes containsTrack for that track
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const query = getQuery(event);
  const trackId =
    typeof query.trackId === "string" ? query.trackId.trim() : "";

  await getOrCreateLikedPlaylist(userId);

  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: { _count: { select: { tracks: true } } },
  });

  playlists.sort((a, b) => {
    const aLiked = isLikedTracksPlaylist(a.systemKind) ? 0 : 1;
    const bLiked = isLikedTracksPlaylist(b.systemKind) ? 0 : 1;
    if (aLiked !== bLiked) return aLiked - bLiked;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  let containingPlaylistIds = new Set<string>();
  if (trackId) {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true },
    });
    if (!track) {
      throwApiError(404, ApiErrorCode.TRACK_NOT_FOUND);
    }

    const rows = await prisma.playlistTrack.findMany({
      where: { trackId, playlist: { userId } },
      select: { playlistId: true },
    });
    containingPlaylistIds = new Set(rows.map((row) => row.playlistId));
  }

  return playlists.map((playlist) => ({
    ...serializePlaylistSummary(playlist),
    ...(trackId
      ? { containsTrack: containingPlaylistIds.has(playlist.id) }
      : {}),
  }));
});
