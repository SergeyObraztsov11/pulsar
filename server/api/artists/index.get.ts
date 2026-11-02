import { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import { listPage, parseListPaging } from "../../utils/listPage";
import { parseListSort } from "../../utils/listSort";

/**
 * GET /api/artists
 * Query:
 * - search — поиск по имени
 * - liked=true — только лайкнутые (нужна сессия)
 * - sort — createdAt | name | likedAt | likes | plays
 * - order — asc | desc
 * - limit — 1…50, default 20
 * - offset — ≥0, default 0
 *
 * Ответ: { items, total, limit, offset }
 */
export default defineEventHandler(async (event) => {
  const userId = getAuthUserId(event);
  const query = getQuery(event) as Record<string, unknown>;
  const paging = parseListPaging(query);
  const { sort, order } = parseListSort(query, "name");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";

  if ((liked || sort === "likedAt") && !userId) {
    throwApiError(401, ApiErrorCode.AUTHENTICATION_REQUIRED);
  }

  const artistWhere: Prisma.UserWhereInput = {
    // Исполнители = пользователи с хотя бы одним альбомом
    albums: { some: {} },
  };

  if (liked && userId) {
    artistWhere.artistLikesReceived = { some: { userId } };
  }

  if (search) {
    artistWhere.name = { contains: search, mode: "insensitive" };
  }

  if (sort === "likedAt" && userId) {
    const likeWhere: Prisma.ArtistLikeWhereInput = {
      userId,
      artist: artistWhere,
    };

    const [total, rows] = await Promise.all([
      prisma.artistLike.count({ where: likeWhere }),
      prisma.artistLike.findMany({
        where: likeWhere,
        orderBy: { createdAt: order },
        skip: paging.offset,
        take: paging.limit,
        include: {
          artist: { select: publicUserSelect },
        },
      }),
    ]);

    return listPage(
      rows.map(({ artist }) => ({
        ...artist,
        isLiked: true,
      })),
      total,
      paging,
    );
  }

  if (sort === "plays") {
    return listArtistsByPlays(artistWhere, order, paging, userId);
  }

  const orderBy = artistOrderBy(sort, order);

  const [total, artists] = await Promise.all([
    prisma.user.count({ where: artistWhere }),
    prisma.user.findMany({
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
      skip: paging.offset,
      take: paging.limit,
    }),
  ]);

  return listPage(
    artists.map(({ artistLikesReceived, ...artist }) => ({
      ...artist,
      isLiked: artistLikesReceived.length > 0,
    })),
    total,
    paging,
  );
});

function artistOrderBy(
  sort: "createdAt" | "name" | "likes" | "plays" | "likedAt",
  order: "asc" | "desc",
): Prisma.UserOrderByWithRelationInput[] {
  if (sort === "createdAt") return [{ createdAt: order }];
  if (sort === "likes") {
    return [
      { artistLikesReceived: { _count: order } },
      { name: "asc" },
    ];
  }
  return [{ name: order }];
}

/** Артисты по числу прослушиваний их треков */
async function listArtistsByPlays(
  artistWhere: Prisma.UserWhereInput,
  order: "asc" | "desc",
  paging: { limit: number; offset: number },
  userId: string | null,
) {
  const matched = await prisma.user.findMany({
    where: artistWhere,
    select: { id: true },
  });
  const total = matched.length;
  if (total === 0) {
    return listPage([], total, paging);
  }

  const ids = matched.map((row) => row.id);
  const ordered = await prisma.$queryRaw<{ id: string }[]>`
    SELECT u.id
    FROM "User" u
    LEFT JOIN "Track" t ON t."artistId" = u.id
    LEFT JOIN "TrackListen" tl ON tl."trackId" = t.id
    WHERE u.id IN (${Prisma.join(ids)})
    GROUP BY u.id
    ORDER BY COUNT(tl.id) ${order === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC")},
             MAX(u.name) ASC
    LIMIT ${paging.limit} OFFSET ${paging.offset}
  `;

  const pageIds = ordered.map((row) => row.id);
  if (pageIds.length === 0) {
    return listPage([], total, paging);
  }

  const artists = await prisma.user.findMany({
    where: { id: { in: pageIds } },
    select: {
      ...publicUserSelect,
      artistLikesReceived: {
        where: { userId: userId ?? "" },
        take: 1,
        select: { userId: true },
      },
    },
  });

  const byId = new Map(artists.map((artist) => [artist.id, artist]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((artist): artist is NonNullable<typeof artist> => artist != null)
    .map(({ artistLikesReceived, ...artist }) => ({
      ...artist,
      isLiked: artistLikesReceived.length > 0,
    }));

  return listPage(items, total, paging);
}
