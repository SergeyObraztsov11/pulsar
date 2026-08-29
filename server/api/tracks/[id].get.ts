import { getAuthUserId } from "../../utils/getAuthUserId";
import { getLikedTrackIdSet } from "../../utils/likedPlaylist";
import { serializeTrackRow } from "../../utils/playlistDetail";

/**
 * GET /api/tracks/:id — track, artist, album, genres, isLiked
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Track id is required" });
  }

  const userId = getAuthUserId(event);

  const [track, likedTrackIds] = await Promise.all([
    prisma.track.findUnique({
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
      },
    }),
    getLikedTrackIdSet(userId),
  ]);

  if (!track) {
    throw createError({ statusCode: 404, statusMessage: "Track not found" });
  }

  return serializeTrackRow(track, likedTrackIds);
});
