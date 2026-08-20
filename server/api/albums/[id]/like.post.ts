import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * POST /api/albums/:id/like — лайкнуть альбом.
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Album id is required" });
  }

  const album = await prisma.album.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!album) {
    throw createError({ statusCode: 404, statusMessage: "Album not found" });
  }

  await prisma.albumLike.upsert({
    where: { userId_albumId: { userId, albumId: id } },
    create: { userId, albumId: id },
    update: {},
  });

  return { isLiked: true };
});
