/**
 * useTrackCard — shared play / like / more / labels for track row cards.
 */
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from "vue";
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";
import { useMediaQuery } from "@vueuse/core";

/** Колонка отдаёт полный список + источник очереди */
export const playerQueueKey: InjectionKey<{
  tracks: ComputedRef<Track[]>;
  source: ComputedRef<PlayerQueueSource | null>;
}> = Symbol("playerQueue");

export function useTrackCard(
  track: MaybeRefOrGetter<Track>,
  options: { interactive?: MaybeRefOrGetter<boolean> } = {},
) {
  const playerStore = usePlayerStore();
  const injectedQueue = inject(playerQueueKey, null);

  /** Tailwind lg — which layout hosts TrackMoreMenu (desktop vs mobile row) */
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const trackValue = computed(() => toValue(track));

  const isCurrent = computed(
    () => playerStore.current?.id === trackValue.value?.id,
  );
  const isLiked = ref(false);
  watch(
    () => trackValue.value?.isLiked,
    (value) => {
      if (value != null) isLiked.value = value;
    },
    { immediate: true },
  );
  const moreOpen = ref(false);
  const isHovered = ref(false);

  const isPlayingCurrent = computed(
    () => isCurrent.value && playerStore.isPlaying,
  );

  const nameLabel = computed(() => trackValue.value?.name ?? "Track");
  const artistLabel = computed(
    () => trackValue.value?.artist?.name ?? "Artist",
  );
  const durationLabel = computed(() => {
    const sec = trackValue.value?.durationSec;
    if (sec == null) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  });
  const coverSrc = computed(
    () => trackValue.value?.album?.coverSrc ?? undefined,
  );

  const trackTo = computed(() => {
    const value = trackValue.value;
    const artistId = value?.artist?.id;
    const albumId = value?.album?.id;
    if (!value?.id || !artistId || !albumId) return "/";
    return `/user/${artistId}/album/${albumId}/track/${value.id}`;
  });

  const artistTo = computed(() => {
    const artistId = trackValue.value?.artist?.id;
    return artistId ? `/user/${artistId}` : "/";
  });

  const showCoverOverlay = computed(
    () => isHovered.value || isCurrent.value,
  );

  function onPlayClick() {
    if (!interactive.value) return;
    const value = trackValue.value;
    if (!value) return;
    if (isCurrent.value) {
      playerStore.togglePlaying();
      return;
    }
    playerStore.play(
      value,
      injectedQueue?.tracks.value,
      injectedQueue?.source.value,
    );
  }

  function toggleLike() {
    if (!interactive.value) return;
    isLiked.value = !isLiked.value;
  }

  return {
    interactive,
    track: trackValue,
    isLgUp,
    isCurrent,
    isLiked,
    isHovered,
    moreOpen,
    isPlayingCurrent,
    nameLabel,
    artistLabel,
    durationLabel,
    coverSrc,
    trackTo,
    artistTo,
    showCoverOverlay,
    onPlayClick,
    toggleLike,
  };
}
