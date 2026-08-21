import { getAuthUserId } from "../../utils/getAuthUserId";
import {
  artistDetailQuery,
  serializeArtistDetail,
} from "../../utils/artistDetail";

/**
 * GET /api/artists/:id — профиль артиста, альбомы, треки и isLiked.
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

  const artist = await prisma.user.findUnique({
    where: { id },
    ...artistDetailQuery(userId),
  });

  if (!artist) {
    throw createError({ statusCode: 404, statusMessage: "Artist not found" });
  }

  return serializeArtistDetail(artist);
});
