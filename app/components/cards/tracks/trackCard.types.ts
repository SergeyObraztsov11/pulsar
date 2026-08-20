/** Props / re-export трека для карточки (данные = API Track). */
import type { Track } from "~/types/track";

export type { Track };

export type TrackCardProps = {
  interactive?: boolean;
  track: Track;
  /** Позиция в чарте (1-based); для ranked-карточки */
  rank?: number;
};
