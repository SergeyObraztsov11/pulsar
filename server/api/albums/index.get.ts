import type { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";

const SORTS = ["newest", "oldest", "name", "likedAt"] as const;
type AlbumSort = (typeof SORTS)[number];

/**
 * GET /api/albums
 * Query:
 * - search — поиск по названию альбома и имени артиста
 * - liked=true — только лайкнутые (нужна сессия)
 * - sort — newest | oldest | name | likedAt (likedAt нужен auth)
 *
 * Примеры:
 *   GET /api/albums
 *   GET /api/albums?search=moon
 *   GET /api/albums?sort=name
 *   GET /api/albums?liked=true&sort=likedAt
 *   GET /api/albums?search=neon&liked=true&sort=newest
 */
export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event);

  const search =
    typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";
  const sortParam = typeof query.sort === "string" ? query.sort : "newest";
  const sort: AlbumSort = SORTS.includes(sortParam as AlbumSort)
    ? (sortParam as AlbumSort)
    : "newest";

  if ((liked || sort === "likedAt") && !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const albumWhere: Prisma.AlbumWhereInput = {};

  if (liked && userId) {
    albumWhere.likes = { some: { userId } };
  }

  if (search) {
    albumWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Сортировка по дате лайка — через AlbumLike
  if (sort === "likedAt" && userId) {
    const rows = await prisma.albumLike.findMany({
      where: {
        userId,
        ...(Object.keys(albumWhere).length > 0
          ? { album: albumWhere }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        album: {
          include: {
            artist: { select: publicUserSelect },
            genres: { include: { genre: true } },
          },
        },
      },
    });

    return rows.map(({ album }) => {
      const { genres, ...rest } = album;
      return {
        ...rest,
        genres: genres.map((row) => row.genre),
        isLiked: true,
      };
    });
  }

  const orderBy: Prisma.AlbumOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const albums = await prisma.album.findMany({
    where: albumWhere,
    include: {
      artist: { select: publicUserSelect },
      genres: { include: { genre: true } },
      likes: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
    orderBy,
  });

  return albums.map(({ genres, likes, ...album }) => ({
    ...album,
    genres: genres.map((row) => row.genre),
    isLiked: likes.length > 0,
  }));
});
