/**
 * Shared artist detail shape for GET /api/artists/:id.
 */
import type { PublicUser } from "../../app/types/publicUser";

const albumCardSelect = {
  id: true,
  name: true,
  coverSrc: true,
  coverColor: true,
} as const;

export function artistLikeFilter(userId: string | null) {
  return {
    where: { userId: userId ?? "" },
    take: 1,
    select: { userId: true },
  } as const;
}

/** select / include for artist detail */
export function artistDetailQuery(userId: string | null) {
  const likes = artistLikeFilter(userId);
  return {
    select: {
      ...publicUserSelect,
      artistLikesReceived: likes,
      artistLinks: {
        orderBy: { sortOrder: "asc" as const },
        select: { kind: true, href: true },
      },
      albums: {
        orderBy: { createdAt: "desc" as const },
        include: {
          genres: { include: { genre: true } },
          likes,
        },
      },
      tracks: {
        orderBy: { createdAt: "desc" as const },
        include: {
          artist: { select: publicUserSelect },
          album: { select: albumCardSelect },
          genres: { include: { genre: true } },
        },
      },
    },
  };
}

type ArtistDetailRow = {
  id: string;
  name: string;
  avatarSrc: string | null;
  bio: string | null;
  country: string | null;
  artistLikesReceived: { userId: string }[];
  artistLinks: { kind: string; href: string }[];
  albums: {
    genres: { genre: { id: string; name: string; slug: string } }[];
    likes: { userId: string }[];
  }[];
  tracks: {
    id: string;
    durationSec: number;
    genres: { genre: { id: string; name: string; slug: string } }[];
  }[];
};

/** Prisma row → API; track isLiked from liked playlist ids */
export function serializeArtistDetail<T extends ArtistDetailRow>(
  artist: T,
  likedTrackIds: Set<string>,
) {
  const { artistLikesReceived, artistLinks, albums, tracks, ...rest } = artist;
  const publicArtist: PublicUser = {
    id: rest.id,
    name: rest.name,
    avatarSrc: rest.avatarSrc,
    bio: rest.bio,
    country: rest.country,
  };

  return {
    ...rest,
    country: rest.country ?? "Россия",
    isLiked: artistLikesReceived.length > 0,
    listenersCount: 0,
    links: artistLinks.map(({ kind, href }) => ({ kind, href })),
    albumCount: albums.length,
    trackCount: tracks.length,
    totalDurationSec: tracks.reduce((sum, track) => sum + track.durationSec, 0),
    albums: albums.map(({ genres, likes, ...album }) => ({
      ...album,
      artist: publicArtist,
      genres: genres.map((row) => row.genre),
      isLiked: likes.length > 0,
    })),
    tracks: tracks.map((track) => serializeTrackRow(track, likedTrackIds)),
  };
}
