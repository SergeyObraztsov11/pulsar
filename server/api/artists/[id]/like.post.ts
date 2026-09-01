import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/artists/:id/like
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.ARTIST_ID_REQUIRED);
  }

  const artist = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!artist) {
    throwApiError(404, ApiErrorCode.ARTIST_NOT_FOUND);
  }

  await prisma.artistLike.upsert({
    where: { userId_artistId: { userId, artistId: id } },
    create: { userId, artistId: id },
    update: {},
  });

  return { isLiked: true };
});
