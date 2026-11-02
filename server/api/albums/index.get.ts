import { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import { listPage, parseListPaging } from "../../utils/listPage";
import { parseListSort } from "../../utils/listSort";

/**
 * GET /api/albums
 * Query:
 * - search — поиск по названию альбома и имени артиста
 * - liked=true — только лайкнутые (нужна сессия)
 * - listened=true — альбомы, которые user недавно слушал (нужна сессия)
 * - genre — slug или id жанра
 * - artistId — альбомы артиста
 * - sort — createdAt | name | likedAt | likes | plays
 * - order — asc | desc (default зависит от sort)
 * - limit — 1…50, default 20
 * - offset — ≥0, default 0
 *
 * Ответ: { items, total, limit, offset }
 */
export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event) as Record<string, unknown>;
  const paging = parseListPaging(query);
  const { sort, order } = parseListSort(query, "createdAt");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";
  const listened = query.listened === "true" || query.listened === "1";
  const genre = typeof query.genre === "string" ? query.genre.trim() : "";
  const artistId =
    typeof query.artistId === "string" ? query.artistId.trim() : "";

  if ((liked || listened || sort === "likedAt") && !userId) {
    throwApiError(401, ApiErrorCode.AUTHENTICATION_REQUIRED);
  }

  /** Недавно слушал — уникальные альбомы по MAX(listenedAt) */
  if (listened && userId) {
    return listListenedAlbums(userId, paging);
  }

  const albumWhere: Prisma.AlbumWhereInput = {};

  if (liked && userId) {
    albumWhere.likes = { some: { userId } };
  }

  if (artistId) {
    albumWhere.artistId = artistId;
  }

  if (genre) {
    albumWhere.genres = {
      some: {
        genre: { OR: [{ slug: genre }, { id: genre }] },
      },
    };
  }

  if (search) {
    albumWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Сортировка по дате своего лайка — через AlbumLike
  if (sort === "likedAt" && userId) {
    const likeWhere: Prisma.AlbumLikeWhereInput = {
      userId,
      ...(Object.keys(albumWhere).length > 0 ? { album: albumWhere } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.albumLike.count({ where: likeWhere }),
      prisma.albumLike.findMany({
        where: likeWhere,
        orderBy: { createdAt: order },
        skip: paging.offset,
        take: paging.limit,
        include: {
          album: {
            include: {
              artist: { select: publicUserSelect },
              genres: { include: { genre: true } },
            },
          },
        },
      }),
    ]);

    return listPage(
      rows.map(({ album }) => {
        const { genres, ...rest } = album;
        return {
          ...rest,
          genres: genres.map((row) => row.genre),
          isLiked: true,
        };
      }),
      total,
      paging,
    );
  }

  const orderBy = albumOrderBy(sort, order);

  // plays — сумма TrackListen по трекам альбома (не прямой relation _count)
  if (sort === "plays") {
    return listAlbumsByPlays(albumWhere, order, paging, userId);
  }

  const [total, albums] = await Promise.all([
    prisma.album.count({ where: albumWhere }),
    prisma.album.findMany({
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
      skip: paging.offset,
      take: paging.limit,
    }),
  ]);

  return listPage(
    albums.map(({ genres, likes, ...album }) => ({
      ...album,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    })),
    total,
    paging,
  );
});

function albumOrderBy(
  sort: "createdAt" | "name" | "likes" | "plays" | "likedAt",
  order: "asc" | "desc",
): Prisma.AlbumOrderByWithRelationInput[] {
  if (sort === "name") return [{ name: order }, { createdAt: "desc" }];
  if (sort === "likes") {
    return [{ likes: { _count: order } }, { createdAt: "desc" }];
  }
  return [{ createdAt: order }];
}

/** Альбомы по числу прослушиваний треков */
async function listAlbumsByPlays(
  albumWhere: Prisma.AlbumWhereInput,
  order: "asc" | "desc",
  paging: { limit: number; offset: number },
  userId: string | null,
) {
  const matched = await prisma.album.findMany({
    where: albumWhere,
    select: { id: true },
  });
  const total = matched.length;
  if (total === 0) {
    return listPage([], total, paging);
  }

  const ids = matched.map((row) => row.id);
  const ordered = await prisma.$queryRaw<{ id: string }[]>`
    SELECT a.id
    FROM "Album" a
    LEFT JOIN "Track" t ON t."albumId" = a.id
    LEFT JOIN "TrackListen" tl ON tl."trackId" = t.id
    WHERE a.id IN (${Prisma.join(ids)})
    GROUP BY a.id
    ORDER BY COUNT(tl.id) ${order === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC")},
             MAX(a."createdAt") DESC
    LIMIT ${paging.limit} OFFSET ${paging.offset}
  `;

  const pageIds = ordered.map((row) => row.id);
  if (pageIds.length === 0) {
    return listPage([], total, paging);
  }

  const albums = await prisma.album.findMany({
    where: { id: { in: pageIds } },
    include: {
      artist: { select: publicUserSelect },
      genres: { include: { genre: true } },
      likes: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
  });

  const byId = new Map(albums.map((album) => [album.id, album]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((album): album is NonNullable<typeof album> => album != null)
    .map(({ genres, likes, ...album }) => ({
      ...album,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    }));

  return listPage(items, total, paging);
}

/** Альбомы текущего user по последнему засчитанному прослушиванию */
async function listListenedAlbums(
  userId: string,
  paging: { limit: number; offset: number },
) {
  const [countRows, ordered] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT t."albumId"
        FROM "TrackListen" tl
        INNER JOIN "Track" t ON t.id = tl."trackId"
        WHERE tl."userId" = ${userId}
        GROUP BY t."albumId"
      ) sub
    `,
    prisma.$queryRaw<{ id: string }[]>`
      SELECT t."albumId" AS id
      FROM "TrackListen" tl
      INNER JOIN "Track" t ON t.id = tl."trackId"
      WHERE tl."userId" = ${userId}
      GROUP BY t."albumId"
      ORDER BY MAX(tl."listenedAt") DESC
      LIMIT ${paging.limit} OFFSET ${paging.offset}
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageIds = ordered.map((row) => row.id);
  if (pageIds.length === 0) {
    return listPage([], total, paging);
  }

  const albums = await prisma.album.findMany({
    where: { id: { in: pageIds } },
    include: {
      artist: { select: publicUserSelect },
      genres: { include: { genre: true } },
      likes: {
        where: { userId },
        take: 1,
        select: { userId: true },
      },
    },
  });

  const byId = new Map(albums.map((album) => [album.id, album]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((album): album is NonNullable<typeof album> => album != null)
    .map(({ genres, likes, ...album }) => ({
      ...album,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    }));

  return listPage(items, total, paging);
}
