import { getAuthUserId } from "../../utils/getAuthUserId";
import {
  artistDetailQuery,
  serializeArtistDetail,
} from "../../utils/artistDetail";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";

/**
 * GET /api/artists/:id
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Artist id is required",
    });
  }

  const userId = getAuthUserId(event);

  const [artist, likedTrackIds] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      ...artistDetailQuery(userId),
    }),
    getLikedTrackIdSet(userId),
  ]);

  if (!artist) {
    throw createError({ statusCode: 404, statusMessage: "Artist not found" });
  }

  return serializeArtistDetail(artist, likedTrackIds);
});
