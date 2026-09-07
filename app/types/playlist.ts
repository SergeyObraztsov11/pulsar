/** System playlist kind from API */
export type PlaylistSystemKind = "liked_tracks";

import type { Track } from "./track";

/** GET /api/playlists item */
export type PlaylistSummary = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverSrc: string | null;
  /** Accent hex для hero; null если своей обложки нет */
  coverColor: string | null;
  isPublic: boolean;
  systemKind: PlaylistSystemKind | null;
  isSystem: boolean;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
  /** Present when fetched with ?trackId= */
  containsTrack?: boolean;
};

/** GET /api/playlists/:id */
export type PlaylistDetail = PlaylistSummary & {
  tracks: Track[];
};
