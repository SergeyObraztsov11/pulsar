import type { Track } from "~/types/track";

/** Откуда собрали очередь; id только у сущности */
export type PlayerQueueSource =
  | { type: "album"; id: string }
  | { type: "artist"; id: string }
  | { type: "playlist"; id: string }
  | { type: "likes" };

export function isSameQueueSource(
  a: PlayerQueueSource | null | undefined,
  b: PlayerQueueSource | null | undefined,
) {
  if (!a || !b || a.type !== b.type) return false;
  if (a.type === "likes") return true;
  return a.id === b.id;
}

export const usePlayerStore = defineStore("player", () => {
  const isExpanded = ref(false);
  const isPlaying = ref(false);
  /** 0..1 — громкость */
  const volume = ref(0.2);
  const isVolumeMuted = ref(false);
  /** Позиция воспроизведения, секунды */
  const currentTime = ref(0);
  /** Длительность из <audio> / API */
  const duration = ref(0);

  /** Доля трека 0..1 — только для полосы / CSS */
  const progressRatio = computed(() =>
    duration.value > 0 ? currentTime.value / duration.value : 0,
  );

  /** Очередь — снимок на play */
  const queue = ref<Track[]>([]);
  const queueIndex = ref(0);
  const current = computed(() => queue.value[queueIndex.value] ?? null);
  /** Откуда собрали очередь (карточка альбома) */
  const queueSource = ref<PlayerQueueSource | null>(null);
  /** Мини/expanded только когда выбран трек */
  const showPlayer = computed(() => current.value != null);
  /** Host применяет к audio.currentTime */
  const seekAt = ref<number | null>(null);
  /** Тянем ползунок: не писать timeupdate в currentTime */
  const isScrubbing = ref(false);

  /** Только треки с файлом */
  function playable(tracks: Track[]) {
    return tracks.filter((track) => Boolean(track.audioSrc));
  }

  function applyTrack(track: Track) {
    currentTime.value = 0;
    duration.value = track.durationSec;
    isPlaying.value = true;
  }

  /** Включить трек; context — очередь (альбом и т.п.) */
  function play(
    track: Track,
    context?: Track[],
    source?: PlayerQueueSource | null,
  ) {
    const list = playable(context ?? [track]);
    const index = list.findIndex((item) => item.id === track.id);
    if (index < 0) return;
    queue.value = list;
    queueIndex.value = index;
    queueSource.value = source ?? null;
    applyTrack(list[index]!);
  }

  function next() {
    if (queueIndex.value >= queue.value.length - 1) {
      isPlaying.value = false;
      return;
    }
    queueIndex.value += 1;
    const track = queue.value[queueIndex.value];
    if (track) applyTrack(track);
  }

  function prev() {
    if (queueIndex.value <= 0) return;
    queueIndex.value -= 1;
    const track = queue.value[queueIndex.value];
    if (track) applyTrack(track);
  }

  function stop() {
    queue.value = [];
    queueIndex.value = 0;
    queueSource.value = null;
    isPlaying.value = false;
    currentTime.value = 0;
    duration.value = 0;
  }

  function setDuration(value: number) {
    if (!Number.isFinite(value) || value < 0) return;
    duration.value = value;
  }

  /** Позиция ползунка, пока зажат — без перемотки audio */
  function previewSeek(seconds: number) {
    isScrubbing.value = true;
    setCurrentTime(seconds);
  }

  /** Перемотка при отпускании; isScrubbing снимет host после audio.currentTime */
  function seek(seconds: number) {
    setCurrentTime(seconds);
    seekAt.value = currentTime.value;
  }

  function openExpanded() {
    isExpanded.value = true;
  }

  function closeExpanded() {
    isExpanded.value = false;
  }

  function toggleExpanded() {
    isExpanded.value = !isExpanded.value;
  }

  function togglePlaying() {
    if (!current.value) return;
    isPlaying.value = !isPlaying.value;
  }

  function setVolume(value: number) {
    volume.value = Math.min(1, Math.max(0, value));
  }
  function muteVolume() {
    isVolumeMuted.value = true;
  }
  function unmuteVolume() {
    isVolumeMuted.value = false;
  }
  function toggleVolume() {
    isVolumeMuted.value = !isVolumeMuted.value;
  }

  function setCurrentTime(value: number) {
    const max = duration.value > 0 ? duration.value : value;
    currentTime.value = Math.min(max, Math.max(0, value));
  }

  return {
    showPlayer,
    isExpanded,
    isPlaying,
    volume,
    currentTime,
    duration,
    progressRatio,
    openExpanded,
    closeExpanded,
    toggleExpanded,
    togglePlaying,
    setVolume,
    isVolumeMuted,
    setCurrentTime,
    toggleVolume,
    muteVolume,
    unmuteVolume,
    current,
    queue,
    queueIndex,
    queueSource,
    play,
    next,
    prev,
    stop,
    seek,
    previewSeek,
    seekAt,
    isScrubbing,
    setDuration,
  };
});
