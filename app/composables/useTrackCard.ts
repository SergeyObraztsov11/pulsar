/**
 * useTrackCard — shared play / like / more / labels for track row cards.
 */
import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { Track } from "~/types/track";
import type { PlayerQueueSource } from "~/stores/player";
import { formatTimeMmSs } from "~/utils/formatTime";

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
  /** Один TrackMoreMenu на карточку — desktop/mobile не дублируют v-model */
  const isLgUp = useMediaQuery("(min-width: 1024px)");

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
    return formatTimeMmSs(sec);
  });
  const isExplicit = computed(() => trackValue.value?.isExplicit ?? false);
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

  /** Index column (TrackIndexCard) */
  const showTrackNumber = computed(() => {
    if (!isLgUp.value) return !isCurrent.value;
    return !interactive.value || (!isHovered.value && !isCurrent.value);
  });

  const showIndexEqualizer = computed(() => {
    if (!isCurrent.value) return false;
    if (!isLgUp.value) return true;
    return interactive.value && !isHovered.value;
  });

  const showIndexPlay = computed(
    () => isLgUp.value && interactive.value && isHovered.value,
  );

  /** Cover overlay (TrackCoverCard / TrackRankedCard) */
  const showCoverOverlayPanel = computed(() => {
    if (!interactive.value) return false;
    if (!isLgUp.value) return isCurrent.value;
    return showCoverOverlay.value;
  });

  const showCoverEqualizer = computed(() => {
    if (!isCurrent.value) return false;
    if (!isLgUp.value) return true;
    return !isHovered.value;
  });

  const showCoverPlay = computed(
    () => isLgUp.value && interactive.value && isHovered.value,
  );

  /** Mobile: tap row → play */
  function onRowClick() {
    if (isLgUp.value || !interactive.value) return;
    onPlayClick();
  }

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
    isLgUp,
    isPlayingCurrent,
    showTrackNumber,
    showIndexEqualizer,
    showIndexPlay,
    showCoverOverlayPanel,
    showCoverEqualizer,
    showCoverPlay,
    nameLabel,
    artistLabel,
    durationLabel,
    isExplicit,
    coverSrc,
    trackTo,
    artistTo,
    albumTo,
    trackId,
    showCoverOverlay,
    onRowClick,
    onPlayClick,
    toggleLike,
  };
}
