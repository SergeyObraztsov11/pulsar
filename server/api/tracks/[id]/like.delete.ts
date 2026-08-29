import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { removeFromLikedPlaylist } from "../../../utils/likedPlaylist";

/**
 * DELETE /api/tracks/:id/like — remove track from «Любимые»
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Track id is required" });
  }

  await removeFromLikedPlaylist(userId, id);

  return { isLiked: false };
});
