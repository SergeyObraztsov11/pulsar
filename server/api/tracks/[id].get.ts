import { getAuthUserId } from "../../utils/getAuthUserId";

/**
 * GET /api/tracks/:id — трек, артист, альбом, жанры и isLiked.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Track id is required" });
  }

  const userId = getAuthUserId(event);

  const track = await prisma.track.findUnique({
    where: { id },
    include: {
      artist: { select: publicUserSelect },
      album: {
        select: {
          id: true,
          name: true,
          coverSrc: true,
          coverColor: true,
          artist: { select: publicUserSelect },
        },
      },
      genres: { include: { genre: true } },
      likes: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
  });

  if (!track) {
    throw createError({ statusCode: 404, statusMessage: "Track not found" });
  }

  const { genres, likes, ...rest } = track;
  return {
    ...rest,
    genres: genres.map((row) => row.genre),
    isLiked: likes.length > 0,
  };
});
