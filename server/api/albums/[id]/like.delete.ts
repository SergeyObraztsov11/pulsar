import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * DELETE /api/albums/:id/like
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ALBUM_ID_REQUIRED);
  }

  await prisma.albumLike.deleteMany({
    where: { userId, albumId: id },
  });

  return { isLiked: false };
});
