import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import {
  albumDetailInclude,
  getAlbumListenersCount,
  serializeAlbumDetail,
} from "../../utils/albumDetail";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";

/**
 * GET /api/albums/:id
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ALBUM_ID_REQUIRED);
  }

  const userId = getAuthUserId(event);

  const [album, likedTrackIds, listenersCount] = await Promise.all([
    prisma.album.findUnique({
      where: { id },
      include: albumDetailInclude(userId),
    }),
    getLikedTrackIdSet(userId),
    getAlbumListenersCount(id),
  ]);

  if (!album) {
    throwApiError(404, ApiErrorCode.ALBUM_NOT_FOUND);
  }

  return serializeAlbumDetail(album, likedTrackIds, listenersCount);
});
