/**
 * GET /api/search — подсказки для строки поиска.
 * Query: q — строка; по 4 трека, альбома и артиста.
 */
import { getAuthUserId } from "../utils/getAuthUserId";

const TAKE = 4;

const albumCardSelect = {
  id: true,
  name: true,
  coverSrc: true,
  coverColor: true,
} as const;

export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event);
  const q = typeof query.q === "string" ? query.q.trim() : "";

  if (!q) {
    return { tracks: [], albums: [], artists: [] };
  }

  const likeUserId = userId ?? "";

  const [trackRows, albumRows, artistRows] = await Promise.all([
    prisma.track.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { artist: { name: { contains: q, mode: "insensitive" } } },
          { album: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        artist: { select: publicUserSelect },
        album: { select: albumCardSelect },
        genres: { include: { genre: true } },
        likes: {
          where: { userId: likeUserId },
          take: 1,
          select: { userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    prisma.album.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { artist: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        artist: { select: publicUserSelect },
        genres: { include: { genre: true } },
        likes: {
          where: { userId: likeUserId },
          take: 1,
          select: { userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    prisma.user.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: {
        ...publicUserSelect,
        artistLikesReceived: {
          where: { userId: likeUserId },
          take: 1,
          select: { userId: true },
        },
      },
      orderBy: { name: "asc" },
      take: TAKE,
    }),
  ]);

  return {
    tracks: trackRows.map(({ genres, likes, ...track }) => ({
      ...track,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    })),
    albums: albumRows.map(({ genres, likes, ...album }) => ({
      ...album,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    })),
    artists: artistRows.map(({ artistLikesReceived, ...artist }) => ({
      ...artist,
      isLiked: artistLikesReceived.length > 0,
    })),
  };
});
