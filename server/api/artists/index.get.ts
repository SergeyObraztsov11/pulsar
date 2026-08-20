import type { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";

const SORTS = ["newest", "oldest", "name", "likedAt"] as const;
type ArtistSort = (typeof SORTS)[number];

/**
 * GET /api/artists
 * Query:
 * - search — поиск по имени
 * - liked=true — только лайкнутые (нужна сессия)
 * - sort — newest | oldest | name | likedAt (likedAt нужен auth)
 *
 * Примеры:
 *   GET /api/artists
 *   GET /api/artists?search=волн
 *   GET /api/artists?liked=true&sort=likedAt
 */
export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event);

  const search =
    typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";
  const sortParam = typeof query.sort === "string" ? query.sort : "name";
  const sort: ArtistSort = SORTS.includes(sortParam as ArtistSort)
    ? (sortParam as ArtistSort)
    : "name";

  if ((liked || sort === "likedAt") && !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const artistWhere: Prisma.UserWhereInput = {};

  if (liked && userId) {
    artistWhere.artistLikesReceived = { some: { userId } };
  }

  if (search) {
    artistWhere.name = { contains: search, mode: "insensitive" };
  }

  if (sort === "likedAt" && userId) {
    const rows = await prisma.artistLike.findMany({
      where: {
        userId,
        ...(Object.keys(artistWhere).length > 0
          ? { artist: artistWhere }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        artist: { select: publicUserSelect },
      },
    });

    return rows.map(({ artist }) => ({
      ...artist,
      isLiked: true,
    }));
  }

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "newest"
        ? { createdAt: "desc" }
        : { name: "asc" };

  const artists = await prisma.user.findMany({
    where: artistWhere,
    select: {
      ...publicUserSelect,
      artistLikesReceived: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
    orderBy,
  });

  return artists.map(({ artistLikesReceived, ...artist }) => ({
    ...artist,
    isLiked: artistLikesReceived.length > 0,
  }));
});
