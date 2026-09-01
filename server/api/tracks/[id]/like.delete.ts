import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { removeFromLikedPlaylist } from "../../../utils/likedPlaylist";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * DELETE /api/tracks/:id/like — remove track from «Любимые»
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.TRACK_ID_REQUIRED);
  }

  await removeFromLikedPlaylist(userId, id);

  return { isLiked: false };
});
