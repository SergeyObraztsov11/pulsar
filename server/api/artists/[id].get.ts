import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import {
  artistDetailQuery,
  getArtistListenersCount,
  serializeArtistDetail,
} from "../../utils/artistDetail";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";

/**
 * GET /api/artists/:id
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ARTIST_ID_REQUIRED);
  }

  const userId = getAuthUserId(event);

  const [artist, likedTrackIds, listenersCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      ...artistDetailQuery(userId),
    }),
    getLikedTrackIdSet(userId),
    getArtistListenersCount(id),
  ]);

  if (!artist) {
    throwApiError(404, ApiErrorCode.ARTIST_NOT_FOUND);
  }

  return serializeArtistDetail(artist, likedTrackIds, listenersCount);
});
