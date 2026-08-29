import { requireAuthUserId } from "../../utils/getAuthUserId";
import { isLikedTracksPlaylist } from "../../utils/likedPlaylist";

/**
 * PATCH /api/playlists/:id — rename / visibility (user playlists only)
 * Body: { name?: string, isPublic?: boolean }
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Playlist id is required" });
  }

  const playlist = await prisma.playlist.findUnique({ where: { id } });
  if (!playlist) {
    throw createError({ statusCode: 404, statusMessage: "Playlist not found" });
  }
  if (playlist.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }
  if (isLikedTracksPlaylist(playlist.systemKind)) {
    throw createError({
      statusCode: 400,
      statusMessage: "System playlist cannot be edited",
    });
  }

  const body = await readBody<{ name?: string; isPublic?: boolean }>(event);
  const name = body.name?.trim();

  if (name !== undefined && (!name || name.length > 120)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Playlist name is required (max 120 chars)",
    });
  }

  const updated = await prisma.playlist.update({
    where: { id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(body.isPublic !== undefined ? { isPublic: body.isPublic === true } : {}),
    },
    include: { _count: { select: { tracks: true } } },
  });

  return {
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    coverSrc: updated.coverSrc,
    isPublic: updated.isPublic,
    systemKind: updated.systemKind,
    isSystem: updated.systemKind != null,
    trackCount: updated._count.tracks,
    createdAt: updated.createdAt,
  };
});
