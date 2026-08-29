/**
 * useTrackCard — shared play / like / more / labels for track row cards.
 */
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from "vue";
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";

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

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const trackValue = computed(() => toValue(track));

  const isCurrent = computed(
    () => playerStore.current?.id === trackValue.value?.id,
  );

  const trackId = computed(() => trackValue.value?.id);
  const { isLiked, toggleLike } = useLike("track", trackId, {
    initial: computed(() => trackValue.value?.isLiked),
    disabled: computed(() => !interactive.value),
  });

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

    const albumTo = computed(() => {
      const value = trackValue.value;
      const artistId = value?.artist?.id;
      const albumId = value?.album?.id;
      if (!artistId || !albumId) return "/";
      return `/user/${artistId}/album/${albumId}`;
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

  return {
    interactive,
    track: trackValue,
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
    albumTo,
    trackId,
    showCoverOverlay,
    onPlayClick,
    toggleLike,
  };
}
