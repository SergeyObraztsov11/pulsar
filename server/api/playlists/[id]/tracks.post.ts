import { requireAuthUserId } from "../../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../../utils/likedPlaylist";

/**
 * POST /api/playlists/:id/tracks — add track to playlist
 * Body: { trackId: string }
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const playlistId = getRouterParam(event, "id");
  if (!playlistId) {
    throw createError({ statusCode: 400, statusMessage: "Playlist id is required" });
  }

  const body = await readBody<{ trackId?: string }>(event);
  const trackId = body.trackId?.trim();
  if (!trackId) {
    throw createError({ statusCode: 400, statusMessage: "trackId is required" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: "Playlist not found" });
  }
  if (playlist.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true },
  });
  if (!track) {
    throw createError({ statusCode: 404, statusMessage: "Track not found" });
  }

  const existing = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
  });
  if (existing) {
    return { ok: true, added: false };
  }

  if (isLikedTracksPlaylist(playlist.systemKind)) {
    const last = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        position: last ? last.position + 1 : 0,
      },
    });
  } else {
    const last = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const position = last ? last.position + 1 : 0;
    await prisma.playlistTrack.create({
      data: { playlistId, trackId, position },
    });
  }

  return { ok: true, added: true };
});
