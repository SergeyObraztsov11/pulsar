import { PlaylistSystemKind } from "../../app/generated/prisma/client";
import { touchPlaylistUpdatedAt } from "./touchPlaylistUpdatedAt";
import { shiftPlaylistPositionsForInsert, compactPlaylistPositionsAfterDelete } from "./playlistPosition";

/** Display name for the system liked-tracks playlist */
export const LIKED_PLAYLIST_NAME = "Мне нравится";

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

/** Add track to «Любимые»; новый трек сверху (position 0) */
export async function addToLikedPlaylist(userId: string, trackId: string) {
  const playlist = await getOrCreateLikedPlaylist(userId);

  const existing = await prisma.playlistTrack.findUnique({
    where: {
      playlistId_trackId: { playlistId: playlist.id, trackId },
    },
  });
  if (existing) return;

  await prisma.$transaction(async (tx) => {
    await shiftPlaylistPositionsForInsert(tx, playlist.id, 0);
    await tx.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        trackId,
        position: 0,
      },
    });
    await touchPlaylistUpdatedAt(playlist.id, tx);
  });
}

/** Remove track from «Любимые» */
export async function removeFromLikedPlaylist(userId: string, trackId: string) {
  const playlist = await getLikedPlaylist(userId);
  if (!playlist) return;

  const row = await prisma.playlistTrack.findUnique({
    where: {
      playlistId_trackId: { playlistId: playlist.id, trackId },
    },
    select: { position: true },
  });
  if (!row) return;

  await prisma.$transaction(async (tx) => {
    await tx.playlistTrack.delete({
      where: {
        playlistId_trackId: { playlistId: playlist.id, trackId },
      },
    });
    await compactPlaylistPositionsAfterDelete(tx, playlist.id, row.position);
    await touchPlaylistUpdatedAt(playlist.id, tx);
  });
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
