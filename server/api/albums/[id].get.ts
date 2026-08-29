import { getAuthUserId } from "../../utils/getAuthUserId";
import {
  albumDetailInclude,
  serializeAlbumDetail,
} from "../../utils/albumDetail";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";

/**
 * GET /api/albums/:id
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Album id is required" });
  }

  const userId = getAuthUserId(event);

  const [album, likedTrackIds] = await Promise.all([
    prisma.album.findUnique({
      where: { id },
      include: albumDetailInclude(userId),
    }),
    getLikedTrackIdSet(userId),
  ]);

  if (!album) {
    throw createError({ statusCode: 404, statusMessage: "Album not found" });
  }

  return serializeAlbumDetail(album, likedTrackIds);
});
