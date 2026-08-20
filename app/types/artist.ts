/**
 * Артист из GET /api/artists (list) = публичный user + isLiked.
 */
import type { PublicUser } from "./publicUser";

export type Artist = PublicUser & {
  isLiked: boolean;
};
