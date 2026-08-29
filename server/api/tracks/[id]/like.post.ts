import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { addToLikedPlaylist } from "../../../utils/likedPlaylist";

/**
 * POST /api/tracks/:id/like — add track to system playlist «Любимые»
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

  await addToLikedPlaylist(userId, id);

  return { isLiked: true };
});
