import { requireAuthUserId } from "../../../utils/getAuthUserId";

/**
 * POST /api/tracks/:id/like — лайкнуть трек.
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Track id is required" });
  }

  const track = await prisma.track.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!track) {
    throw createError({ statusCode: 404, statusMessage: "Track not found" });
  }

  await prisma.trackLike.upsert({
    where: { userId_trackId: { userId, trackId: id } },
    create: { userId, trackId: id },
    update: {},
  });

  return { isLiked: true };
});
