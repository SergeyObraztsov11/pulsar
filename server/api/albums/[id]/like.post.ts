import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/albums/:id/like
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ALBUM_ID_REQUIRED);
  }

  const album = await prisma.album.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!album) {
    throwApiError(404, ApiErrorCode.ALBUM_NOT_FOUND);
  }

  await prisma.albumLike.upsert({
    where: { userId_albumId: { userId, albumId: id } },
    create: { userId, albumId: id },
    update: {},
  });

  return { isLiked: true };
});
