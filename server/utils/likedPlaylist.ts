import { PlaylistSystemKind } from "../../app/generated/prisma/client";
import { touchPlaylistUpdatedAt } from "./touchPlaylistUpdatedAt";

/** Display name for the system liked-tracks playlist */
export const LIKED_PLAYLIST_NAME = "Мне нравится";

/** Default cover in public/ for system playlist «Любимые» */
export const LIKED_PLAYLIST_COVER_SRC = "/covers/image.png";

export function isLikedTracksPlaylist(
  systemKind: PlaylistSystemKind | null | undefined,
) {
  return systemKind === PlaylistSystemKind.liked_tracks;
}

/** System playlist «Любимые» for user, if it exists */
export async function getLikedPlaylist(userId: string) {
  return prisma.playlist.findFirst({
    where: { userId, systemKind: PlaylistSystemKind.liked_tracks },
  });
}

/** Find or create system playlist «Любимые» */
export async function getOrCreateLikedPlaylist(userId: string) {
  const existing = await getLikedPlaylist(userId);
  if (existing) return existing;

  return prisma.playlist.create({
    data: {
      userId,
      name: LIKED_PLAYLIST_NAME,
      systemKind: PlaylistSystemKind.liked_tracks,
      isPublic: false,
    },
  });
}

/** All track ids in user's «Любимые»; creates empty playlist if missing */
export async function getLikedTrackIdSet(
  userId: string | null | undefined,
): Promise<Set<string>> {
  if (!userId) return new Set();

  const playlist = await getOrCreateLikedPlaylist(userId);

  const rows = await prisma.playlistTrack.findMany({
    where: { playlistId: playlist.id },
    select: { trackId: true },
  });

  return new Set(rows.map((row) => row.trackId));
}

/** Add track to «Любимые»; order is by addedAt desc, position is append-only */
export async function addToLikedPlaylist(userId: string, trackId: string) {
  const playlist = await getOrCreateLikedPlaylist(userId);

  const existing = await prisma.playlistTrack.findUnique({
    where: {
      playlistId_trackId: { playlistId: playlist.id, trackId },
    },
  });
  if (existing) return;

  const last = await prisma.playlistTrack.findFirst({
    where: { playlistId: playlist.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        trackId,
        position: last ? last.position + 1 : 0,
      },
    });
    await touchPlaylistUpdatedAt(playlist.id, tx);
  });
}

/** Remove track from «Любимые» */
export async function removeFromLikedPlaylist(userId: string, trackId: string) {
  const playlist = await getLikedPlaylist(userId);
  if (!playlist) return;

  const deleted = await prisma.playlistTrack.deleteMany({
    where: { playlistId: playlist.id, trackId },
  });
  if (deleted.count > 0) {
    await touchPlaylistUpdatedAt(playlist.id);
  }
}

/** Create «Любимые» inside user registration transaction */
export async function createLikedPlaylistForUser(
  tx: Pick<typeof prisma, "playlist">,
  userId: string,
) {
  return tx.playlist.create({
    data: {
      userId,
      name: LIKED_PLAYLIST_NAME,
      systemKind: PlaylistSystemKind.liked_tracks,
      isPublic: false,
    },
  });
}
