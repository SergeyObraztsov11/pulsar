/**
 * Shared album detail shape for GET /api/albums/:id and POST /api/albums.
 */
export function albumLikeFilter(userId: string | null) {
  return {
    where: { userId: userId ?? "" },
    take: 1,
    select: { userId: true },
  } as const;
}

/** include for album detail */
export function albumDetailInclude(userId: string | null) {
  const likes = albumLikeFilter(userId);
  return {
    artist: { select: publicUserSelect },
    genres: { include: { genre: true } },
    likes,
    _count: { select: { likes: true, tracks: true } },
    tracks: {
      orderBy: { trackNumber: "asc" as const },
      include: {
        artist: { select: publicUserSelect },
        album: { select: { id: true, name: true, coverSrc: true, coverColor: true } },
        genres: { include: { genre: true } },
      },
    },
  };
}

type AlbumDetailRow = {
  genres: { genre: { id: string; name: string; slug: string } }[];
  likes: { userId: string }[];
  _count: { likes: number; tracks: number };
  tracks: {
    id: string;
    durationSec: number;
    genres: { genre: { id: string; name: string; slug: string } }[];
  }[];
};

/** Prisma row → API; track isLiked from liked playlist ids */
export function serializeAlbumDetail<T extends AlbumDetailRow>(
  album: T,
  likedTrackIds: Set<string>,
  listenersCount: number,
) {
  const { genres, likes, tracks, _count, ...rest } = album;
  return {
    ...rest,
    genres: genres.map((row) => row.genre),
    isLiked: likes.length > 0,
    likesCount: _count.likes,
    listenersCount,
    trackCount: _count.tracks,
    totalDurationSec: tracks.reduce((sum, track) => sum + track.durationSec, 0),
    tracks: tracks.map((track) =>
      serializeTrackRow(track, likedTrackIds),
    ),
  };
}

/** Уникальные пользователи с хотя бы одним listen на треках альбома */
export async function getAlbumListenersCount(albumId: string) {
  const groups = await prisma.trackListen.groupBy({
    by: ["userId"],
    where: { track: { albumId } },
  });
  return groups.length;
}
