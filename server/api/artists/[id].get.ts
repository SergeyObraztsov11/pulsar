import { getAuthUserId } from "../../utils/getAuthUserId";

/**
 * GET /api/artists/:id — профиль артиста, альбомы (без треков) и isLiked.
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
    select: {
      ...publicUserSelect,
      artistLikesReceived: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
      albums: {
        orderBy: { createdAt: "desc" },
        include: {
          genres: { include: { genre: true } },
          likes: {
            where: { userId: userId ?? "" },
            take: 1,
            select: { userId: true },
          },
        },
      },
    },
  });

  if (!artist) {
    throw createError({ statusCode: 404, statusMessage: "Artist not found" });
  }

  const { artistLikesReceived, albums, ...rest } = artist;

  return {
    ...rest,
    isLiked: artistLikesReceived.length > 0,
    albums: albums.map(({ genres, likes, ...album }) => ({
      ...album,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    })),
  };
});
