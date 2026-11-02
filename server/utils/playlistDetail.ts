import type { H3Event } from "h3";
import type { PlaylistSystemKind } from "../../app/generated/prisma/client";
import {
  isLikedTracksPlaylist,
  LIKED_PLAYLIST_NAME,
} from "./likedPlaylist";
import { requireAuthUserId } from "./getAuthUserId";
import { ApiErrorCode, throwApiError } from "./apiError";

export const PLAYLIST_NAME_MAX_LENGTH = 120;
export const PLAYLIST_DESCRIPTION_MAX_LENGTH = 1000;
export const PLAYLIST_COVER_MAX_BYTES = 10 * 1024 * 1024;

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
  description: string | null;
  coverSrc: string | null;
  coverColor: string | null;
  isPublic: boolean;
  systemKind: PlaylistSystemKind | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { tracks: number };
};

export function serializePlaylistSummary(playlist: PlaylistRow) {
  return {
    id: playlist.id,
    userId: playlist.userId,
    name: isLikedTracksPlaylist(playlist.systemKind)
      ? LIKED_PLAYLIST_NAME
      : playlist.name,
    description: playlist.description,
    coverSrc: playlist.coverSrc,
    /** Accent только от своей загруженной обложки; у «Любимых» без upload — null */
    coverColor: playlist.coverColor,
    isPublic: playlist.isPublic,
    systemKind: playlist.systemKind,
    isSystem: playlist.systemKind != null,
    trackCount: playlist._count?.tracks ?? 0,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
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

/** Owner-only user playlist (not system «Мне нравится») */
export async function requireEditableUserPlaylist(
  event: H3Event,
  playlistId: string,
) {
  const userId = requireAuthUserId(event);

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { _count: { select: { tracks: true } } },
  });

  if (!playlist) {
    throwApiError(404, ApiErrorCode.PLAYLIST_NOT_FOUND);
  }
  if (playlist.userId !== userId) {
    throwApiError(403, ApiErrorCode.FORBIDDEN);
  }
  if (isLikedTracksPlaylist(playlist.systemKind)) {
    throwApiError(400, ApiErrorCode.SYSTEM_PLAYLIST_NOT_EDITABLE);
  }

  return playlist;
}
