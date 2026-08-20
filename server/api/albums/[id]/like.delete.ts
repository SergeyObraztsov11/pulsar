import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * DELETE /api/albums/:id/like — убрать лайк альбома.
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Album id is required" });
  }

  await prisma.albumLike.deleteMany({
    where: { userId, albumId: id },
  });

  return { isLiked: false };
});
