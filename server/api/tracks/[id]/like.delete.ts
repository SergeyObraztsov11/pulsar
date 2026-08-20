import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * DELETE /api/tracks/:id/like — убрать лайк трека.
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Track id is required" });
  }

  await prisma.trackLike.deleteMany({
    where: { userId, trackId: id },
  });

  return { isLiked: false };
});
