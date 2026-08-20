/**
 * Общий вид альбома для GET /api/albums/:id и POST /api/albums.
 */
export function albumLikeFilter(userId: string | null) {
  return {
    where: { userId: userId ?? "" },
    take: 1,
    select: { userId: true },
  } as const;
}

/** include для детального альбома */
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
        likes,
      },
    },
  };
}

type AlbumDetailRow = {
  genres: { genre: { id: string; name: string; slug: string } }[];
  likes: { userId: string }[];
  _count: { likes: number; tracks: number };
  tracks: {
    durationSec: number;
    genres: { genre: { id: string; name: string; slug: string } }[];
    likes: { userId: string }[];
  }[];
};

/** Prisma-строка → ответ API */
export function serializeAlbumDetail<T extends AlbumDetailRow>(album: T) {
  const { genres, likes, tracks, _count, ...rest } = album;
  return {
    ...rest,
    genres: genres.map((row) => row.genre),
    isLiked: likes.length > 0,
    likesCount: _count.likes,
    trackCount: _count.tracks,
    totalDurationSec: tracks.reduce((sum, track) => sum + track.durationSec, 0),
    tracks: tracks.map(({ genres: trackGenres, likes: trackLikes, ...track }) => ({
      ...track,
      genres: trackGenres.map((row) => row.genre),
      isLiked: trackLikes.length > 0,
    })),
  };
}
