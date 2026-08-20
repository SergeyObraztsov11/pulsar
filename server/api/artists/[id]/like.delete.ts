import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * DELETE /api/artists/:id/like — убрать лайк артиста.
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Artist id is required",
    });
  }

  await prisma.artistLike.deleteMany({
    where: { userId, artistId: id },
  });

  return { isLiked: false };
});
