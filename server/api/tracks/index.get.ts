import { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";
import { ApiErrorCode, throwApiError } from "../../utils/apiError";
import {
  getLikedTrackIdSet,
  getOrCreateLikedPlaylist,
} from "../../utils/likedPlaylist";
import { listPage, parseListPaging } from "../../utils/listPage";
import { parseListSort } from "../../utils/listSort";
import { serializeTrackRow } from "../../utils/playlistDetail";

const albumCardSelect = {
  id: true,
  name: true,
  coverSrc: true,
  coverColor: true,
} as const;

const trackListInclude = {
  artist: { select: publicUserSelect },
  album: { select: albumCardSelect },
  genres: { include: { genre: true } },
} as const;

/**
 * GET /api/tracks
 * Query:
 * - search — track / artist / album name
 * - liked=true — tracks from system playlist «Любимые» (auth)
 * - genre — slug или id жанра
 * - artistId — треки артиста
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
  const { sort, order } = parseListSort(query, "createdAt");

  const search = typeof query.search === "string" ? query.search.trim() : "";
  const liked = query.liked === "true" || query.liked === "1";
  const genre = typeof query.genre === "string" ? query.genre.trim() : "";
  const artistId =
    typeof query.artistId === "string" ? query.artistId.trim() : "";

  if ((liked || sort === "likedAt") && !userId) {
    throwApiError(401, ApiErrorCode.AUTHENTICATION_REQUIRED);
  }

  const trackWhere: Prisma.TrackWhereInput = {};

  if (artistId) {
    trackWhere.artistId = artistId;
  }

  if (genre) {
    trackWhere.genres = {
      some: {
        genre: { OR: [{ slug: genre }, { id: genre }] },
      },
    };
  }

  if (search) {
    trackWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
      { album: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const likedTrackIds = await getLikedTrackIdSet(userId);

  /** sort=likedAt — порядок по дате добавления в «Любимые» */
  if (sort === "likedAt" && userId) {
    const playlist = await getOrCreateLikedPlaylist(userId);
    const ptWhere: Prisma.PlaylistTrackWhereInput = {
      playlistId: playlist.id,
      ...(Object.keys(trackWhere).length > 0 ? { track: trackWhere } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.playlistTrack.count({ where: ptWhere }),
      prisma.playlistTrack.findMany({
        where: ptWhere,
        orderBy: { addedAt: order },
        skip: paging.offset,
        take: paging.limit,
        include: { track: { include: trackListInclude } },
      }),
    ]);

    return listPage(
      rows.map(({ track }) => ({
        ...serializeTrackRow(track, likedTrackIds),
        isLiked: true,
      })),
      total,
      paging,
    );
  }

  if (liked && userId) {
    const playlist = await getOrCreateLikedPlaylist(userId);
    trackWhere.playlistTracks = { some: { playlistId: playlist.id } };
  }

  if (sort === "likes") {
    return listTracksByLikes(trackWhere, order, paging, likedTrackIds);
  }

  const orderBy = trackOrderBy(sort, order);

  const [total, tracks] = await Promise.all([
    prisma.track.count({ where: trackWhere }),
    prisma.track.findMany({
      where: trackWhere,
      include: trackListInclude,
      orderBy,
      skip: paging.offset,
      take: paging.limit,
    }),
  ]);

  return listPage(
    tracks.map((track) => serializeTrackRow(track, likedTrackIds)),
    total,
    paging,
  );
});

function trackOrderBy(
  sort: "createdAt" | "name" | "likes" | "plays" | "likedAt",
  order: "asc" | "desc",
): Prisma.TrackOrderByWithRelationInput[] {
  if (sort === "name") return [{ name: order }, { createdAt: "desc" }];
  if (sort === "plays") {
    return [{ listens: { _count: order } }, { createdAt: "desc" }];
  }
  return [{ createdAt: order }];
}

/** Треки по числу лайков (= вхождений в system «Любимые») */
async function listTracksByLikes(
  trackWhere: Prisma.TrackWhereInput,
  order: "asc" | "desc",
  paging: { limit: number; offset: number },
  likedTrackIds: Set<string>,
) {
  const matched = await prisma.track.findMany({
    where: trackWhere,
    select: { id: true },
  });
  const total = matched.length;
  if (total === 0) {
    return listPage([], total, paging);
  }

  const ids = matched.map((row) => row.id);
  const ordered = await prisma.$queryRaw<{ id: string }[]>`
    SELECT t.id
    FROM "Track" t
    LEFT JOIN "PlaylistTrack" pt ON pt."trackId" = t.id
    LEFT JOIN "Playlist" p
      ON p.id = pt."playlistId" AND p."systemKind" = 'liked_tracks'
    WHERE t.id IN (${Prisma.join(ids)})
    GROUP BY t.id
    ORDER BY COUNT(p.id) ${order === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC")},
             MAX(t."createdAt") DESC
    LIMIT ${paging.limit} OFFSET ${paging.offset}
  `;

  const pageIds = ordered.map((row) => row.id);
  if (pageIds.length === 0) {
    return listPage([], total, paging);
  }

  const tracks = await prisma.track.findMany({
    where: { id: { in: pageIds } },
    include: trackListInclude,
  });

  const byId = new Map(tracks.map((track) => [track.id, track]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((track): track is NonNullable<typeof track> => track != null)
    .map((track) => serializeTrackRow(track, likedTrackIds));

  return listPage(items, total, paging);
}
