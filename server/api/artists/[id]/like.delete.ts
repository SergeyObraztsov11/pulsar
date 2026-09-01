import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * DELETE /api/artists/:id/like
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ARTIST_ID_REQUIRED);
  }

  await prisma.artistLike.deleteMany({
    where: { userId, artistId: id },
  });

  return { isLiked: false };
});
