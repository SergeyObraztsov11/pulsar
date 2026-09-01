/** Props / re-export playlist for card (data = API PlaylistSummary). */
import type { PlaylistSummary } from "~/types/playlist";

export type { PlaylistSummary };

export type PlaylistCardProps = {
  interactive?: boolean;
  playlist: PlaylistSummary;
};
