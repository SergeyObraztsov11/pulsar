/** Props / re-export альбома для карточки (данные = API Album). */
import type { Album } from "~/types/album";

export type { Album };

export type AlbumCardProps = {
  interactive?: boolean;
  album: Album;
};
