/** Props / re-export артиста для карточки (данные = API Artist). */
import type { Artist } from "~/types/artist";

export type { Artist };

export type ArtistCardProps = {
  interactive?: boolean;
  artist: Artist;
};
