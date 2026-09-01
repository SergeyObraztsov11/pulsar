import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { addToLikedPlaylist } from "../../../utils/likedPlaylist";
import { ApiErrorCode, throwApiError } from "../../../utils/apiError";

/**
 * POST /api/tracks/:id/like — add track to system playlist «Любимые»
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throwApiError(400, ApiErrorCode.TRACK_ID_REQUIRED);
  }

  const track = await prisma.track.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!track) {
    throwApiError(404, ApiErrorCode.TRACK_NOT_FOUND);
  }

  await addToLikedPlaylist(userId, id);

  return { isLiked: true };
});
