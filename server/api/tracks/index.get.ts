import type { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";

const SORTS = ["newest", "oldest", "name", "likedAt"] as const;
type TrackSort = (typeof SORTS)[number];

const albumCardSelect = {
  id: true,
  name: true,
  coverSrc: true,
  coverColor: true,
} as const;

/**
 * GET /api/tracks
 * Query:
 * - search — поиск по названию трека, артиста и альбома
 * - liked=true — только лайкнутые (нужна сессия)
 * - sort — newest | oldest | name | likedAt (likedAt нужен auth)
 *
 * Примеры:
 *   GET /api/tracks
 *   GET /api/tracks?search=night
 *   GET /api/tracks?sort=name
 *   GET /api/tracks?liked=true&sort=likedAt
 */
export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event);

  const search =
    typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";
  const sortParam = typeof query.sort === "string" ? query.sort : "newest";
  const sort: TrackSort = SORTS.includes(sortParam as TrackSort)
    ? (sortParam as TrackSort)
    : "newest";

  if ((liked || sort === "likedAt") && !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const trackWhere: Prisma.TrackWhereInput = {};

  if (liked && userId) {
    trackWhere.likes = { some: { userId } };
  }

  if (search) {
    trackWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
      { album: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (sort === "likedAt" && userId) {
    const rows = await prisma.trackLike.findMany({
      where: {
        userId,
        ...(Object.keys(trackWhere).length > 0
          ? { track: trackWhere }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        track: {
          include: {
            artist: { select: publicUserSelect },
            album: { select: albumCardSelect },
            genres: { include: { genre: true } },
          },
        },
      },
    });

    return rows.map(({ track }) => {
      const { genres, ...rest } = track;
      return {
        ...rest,
        genres: genres.map((row) => row.genre),
        isLiked: true,
      };
    });
  }

  const orderBy: Prisma.TrackOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const tracks = await prisma.track.findMany({
    where: trackWhere,
    include: {
      artist: { select: publicUserSelect },
      album: { select: albumCardSelect },
      genres: { include: { genre: true } },
      likes: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
    orderBy,
  });

  return tracks.map(({ genres, likes, ...track }) => ({
    ...track,
    genres: genres.map((row) => row.genre),
    isLiked: likes.length > 0,
  }));
});
