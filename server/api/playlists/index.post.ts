import { requireAuthUserId } from "../../utils/getAuthUserId";

/**
 * POST /api/playlists — create user playlist (not system)
 * Body: { name: string, isPublic?: boolean }
 */
export default defineEventHandler(async (event) => {
  const userId = requireAuthUserId(event);
  const body = await readBody<{ name?: string; isPublic?: boolean }>(event);

  const name = body.name?.trim() ?? "";
  if (!name || name.length > 120) {
    throw createError({
      statusCode: 400,
      statusMessage: "Playlist name is required (max 120 chars)",
    });
  }

  const playlist = await prisma.playlist.create({
    data: {
      userId,
      name,
      isPublic: body.isPublic === true,
    },
    include: { _count: { select: { tracks: true } } },
  });

  return {
    id: playlist.id,
    userId: playlist.userId,
    name: playlist.name,
    coverSrc: playlist.coverSrc,
    isPublic: playlist.isPublic,
    systemKind: playlist.systemKind,
    isSystem: false,
    trackCount: playlist._count.tracks,
    createdAt: playlist.createdAt,
  };
});
