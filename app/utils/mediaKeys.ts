/**
 * Ключи объектов в бакете media.
 */
export function audioObjectKey(trackId: string) {
  return `audio/${trackId}.mp3`;
}

export function albumCoverKey(albumId: string, ext: "jpg" | "webp" = "webp") {
  return `covers/albums/${albumId}.${ext}`;
}

export function playlistCoverKey(playlistId: string) {
  return `covers/playlists/${playlistId}.jpg`;
}

export function avatarObjectKey(userId: string) {
  return `avatars/${userId}.jpg`;
}

/** c1.jpg … c10.jpg → альбом / артист (как в seed) */
export const SEED_COVER_MAP = [
  { file: "c1.jpg", albumId: "valentina", userId: "platina" },
  { file: "c2.jpg", albumId: "gorizont", userId: "volna" },
  { file: "c3.jpg", albumId: "ekho", userId: "liniya" },
  { file: "c4.jpg", albumId: "leto-24", userId: "yug" },
  { file: "c5.jpg", albumId: "na-povtore", userId: "sdvig" },
  { file: "c6.jpg", albumId: "tishe", userId: "more" },
  { file: "c7.jpg", albumId: "sdvig-album", userId: "kadr" },
  { file: "c8.jpg", albumId: "kadr-album", userId: "aura" },
  { file: "c9.jpg", albumId: "liniya-album", userId: "piksel" },
  { file: "c10.jpg", albumId: "yug-album", userId: "severnyy" },
] as const;

export const SEED_PLAYLIST_COVERS = [
  { playlistId: "likes-mix", file: "c1.jpg" },
  { playlistId: "evening", file: "c3.jpg" },
] as const;

/** Сидовые треки, на которые вешаем mp3 из public/audio (по алфавиту файлов) */
export const SEED_AUDIO_TRACK_IDS = [
  "track-1",
  "track-2",
  "track-3",
  "track-4",
  "track-5",
  "track-6",
] as const;
