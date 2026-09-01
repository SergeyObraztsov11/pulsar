import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";
import { serializeTrackRow } from "../../utils/playlistDetail";

/**
 * GET /api/tracks/:id — track, artist, album, genres, isLiked
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.TRACK_ID_REQUIRED);
  }

  const userId = getAuthUserId(event);

  const [track, likedTrackIds] = await Promise.all([
    prisma.track.findUnique({
      where: { id },
      include: {
        artist: { select: publicUserSelect },
        album: {
          select: {
            id: true,
            name: true,
            coverSrc: true,
            coverColor: true,
            artist: { select: publicUserSelect },
          },
        },
        genres: { include: { genre: true } },
      },
    }),
    getLikedTrackIdSet(userId),
  ]);

  if (!track) {
    throwApiError(404, ApiErrorCode.TRACK_NOT_FOUND);
  }

  return serializeTrackRow(track, likedTrackIds);
});
