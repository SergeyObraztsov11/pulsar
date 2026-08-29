/** System playlist kind from API */
export type PlaylistSystemKind = "liked_tracks";

/** GET /api/playlists item */
export type PlaylistSummary = {
  id: string;
  userId: string;
  name: string;
  coverSrc: string | null;
  isPublic: boolean;
  systemKind: PlaylistSystemKind | null;
  isSystem: boolean;
  trackCount: number;
  createdAt: string;
  /** Present when fetched with ?trackId= */
  containsTrack?: boolean;
};
