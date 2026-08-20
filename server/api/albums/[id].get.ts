import { getAuthUserId } from "../../utils/getAuthUserId";
import {
  albumDetailInclude,
  serializeAlbumDetail,
} from "../../utils/albumDetail";

/**
 * GET /api/albums/:id — альбом целиком: артист, жанры, счётчик лайков,
 * isLiked и треки в том же виде, что в GET /api/tracks.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Album id is required" });
  }

  const userId = getAuthUserId(event);

  const album = await prisma.album.findUnique({
    where: { id },
    include: albumDetailInclude(userId),
  });

  if (!album) {
    throw createError({ statusCode: 404, statusMessage: "Album not found" });
  }

  return serializeAlbumDetail(album);
});
