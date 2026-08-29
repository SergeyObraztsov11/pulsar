import type { Prisma } from "../../../app/generated/prisma/client";
import { getAuthUserId } from "../../utils/getAuthUserId";
import {
  getLikedTrackIdSet,
  getOrCreateLikedPlaylist,
} from "../../utils/likedPlaylist";
import { serializeTrackRow } from "../../utils/playlistDetail";

const SORTS = ["newest", "oldest", "name", "likedAt"] as const;
type TrackSort = (typeof SORTS)[number];

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
 * - sort — newest | oldest | name | likedAt (likedAt needs auth)
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

  if (search) {
    trackWhere.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { artist: { name: { contains: search, mode: "insensitive" } } },
      { album: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const likedTrackIds = await getLikedTrackIdSet(userId);

  if (liked && userId) {
    const playlist = await getOrCreateLikedPlaylist(userId);

    const rows = await prisma.playlistTrack.findMany({
      where: {
        playlistId: playlist.id,
        ...(Object.keys(trackWhere).length > 0 ? { track: trackWhere } : {}),
      },
      orderBy: { addedAt: "desc" },
      include: { track: { include: trackListInclude } },
    });

    return rows.map(({ track }) => ({
      ...serializeTrackRow(track, likedTrackIds),
      isLiked: true,
    }));
  }

  if (sort === "likedAt" && userId) {
    const playlist = await getOrCreateLikedPlaylist(userId);

    const rows = await prisma.playlistTrack.findMany({
      where: {
        playlistId: playlist.id,
        ...(Object.keys(trackWhere).length > 0 ? { track: trackWhere } : {}),
      },
      orderBy: { addedAt: "desc" },
      include: { track: { include: trackListInclude } },
    });

    return rows.map(({ track }) => ({
      ...serializeTrackRow(track, likedTrackIds),
      isLiked: true,
    }));
  }

  const orderBy: Prisma.TrackOrderByWithRelationInput =
    sort === "oldest"
      ? { createdAt: "asc" }
      : sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

  const tracks = await prisma.track.findMany({
    where: trackWhere,
    include: trackListInclude,
    orderBy,
  });

  return tracks.map((track) => serializeTrackRow(track, likedTrackIds));
});
