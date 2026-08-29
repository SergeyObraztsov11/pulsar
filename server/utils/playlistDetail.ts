import type { PlaylistSystemKind } from "../../app/generated/prisma/client";

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

/** Serialize track row with isLiked from liked playlist membership */
export function serializeTrackRow<T extends {
  id: string;
  genres: { genre: { id: string; name: string; slug: string } }[];
}>(
  track: T,
  likedTrackIds: Set<string>,
) {
  const { genres, ...rest } = track;
  return {
    ...rest,
    genres: genres.map((row) => row.genre),
    isLiked: likedTrackIds.has(track.id),
  };
}

/** Tracks in playlist order (position asc) */
export async function fetchPlaylistTracks(playlistId: string) {
  return prisma.playlistTrack.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
    include: {
      track: { include: trackListInclude },
    },
  });
}

/** Tracks in playlist order by addedAt desc */
export async function fetchPlaylistTracksByAddedAt(playlistId: string) {
  return prisma.playlistTrack.findMany({
    where: { playlistId },
    orderBy: { addedAt: "desc" },
    include: {
      track: { include: trackListInclude },
    },
  });
}

type PlaylistRow = {
  id: string;
  userId: string;
  name: string;
  coverSrc: string | null;
  isPublic: boolean;
  systemKind: PlaylistSystemKind | null;
  createdAt: Date;
  _count?: { tracks: number };
};

export function serializePlaylistSummary(playlist: PlaylistRow) {
  return {
    id: playlist.id,
    userId: playlist.userId,
    name: playlist.name,
    coverSrc: playlist.coverSrc,
    isPublic: playlist.isPublic,
    systemKind: playlist.systemKind,
    isSystem: playlist.systemKind != null,
    trackCount: playlist._count?.tracks ?? 0,
    createdAt: playlist.createdAt,
  };
}

export function serializePlaylistDetail(
  playlist: PlaylistRow,
  trackRows: Awaited<ReturnType<typeof fetchPlaylistTracks>>,
  likedTrackIds: Set<string>,
) {
  return {
    ...serializePlaylistSummary(playlist),
    tracks: trackRows.map(({ track }) =>
      serializeTrackRow(track, likedTrackIds),
    ),
  };
}
