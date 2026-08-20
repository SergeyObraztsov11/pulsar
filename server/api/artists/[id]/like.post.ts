import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * POST /api/artists/:id/like — лайкнуть артиста (не себя).
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

  if (userId === id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot like yourself",
    });
  }

  const artist = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!artist) {
    throw createError({ statusCode: 404, statusMessage: "Artist not found" });
  }

  await prisma.artistLike.upsert({
    where: { userId_artistId: { userId, artistId: id } },
    create: { userId, artistId: id },
    update: {},
  });

  return { isLiked: true };
});
