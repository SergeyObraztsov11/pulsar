/**
 * useArtistCard — play / like / more / labels для карточки артиста.
 */
import type { MaybeRefOrGetter } from "vue";
import type { Artist, ArtistDetail } from "~/types/artist";
import { isSameQueueSource } from "~/stores/player";

export function useArtistCard(
  artist: MaybeRefOrGetter<Artist>,
  options: { interactive?: MaybeRefOrGetter<boolean> } = {},
) {
  const playerStore = usePlayerStore();

  /** Tailwind lg — меню и play только на desktop */
  const isLgUp = useLgUp();

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const artistValue = computed(() => toValue(artist));

  const artistTo = computed(() => {
    const id = artistValue.value?.id;
    return id ? `/user/${id}` : "/";
  });

  const artistId = computed(() => artistValue.value?.id);
  const { isLiked, toggleLike } = useLike("artist", artistId, {
    initial: computed(() => artistValue.value?.isLiked),
    disabled: computed(() => !interactive.value),
  });

  const moreOpen = ref(false);
  const playPending = ref(false);

  const isCurrentArtist = computed(() => {
    const id = artistValue.value?.id;
    if (!id) return false;
    return isSameQueueSource(playerStore.queueSource, { type: "artist", id });
  });

  const isPlaying = computed(
    () => isCurrentArtist.value && playerStore.isPlaying,
  );

  const nameLabel = computed(() => artistValue.value?.name ?? "Artist");

  async function onPlayClick() {
    if (!interactive.value) return;
    const id = artistValue.value?.id;
    if (!id) return;
    if (isCurrentArtist.value) {
      playerStore.togglePlaying();
      return;
    }
    playPending.value = true;
    try {
      const detail = await $fetch<ArtistDetail>(`/api/artists/${id}`);
      const first = detail.tracks.find((track) => Boolean(track.audioSrc));
      if (!first) return;
      playerStore.play(first, detail.tracks, {
        type: "artist",
        id,
        title: detail.name,
      });
    } catch {
      // Артист недоступен — play с карточки игнорируем
    } finally {
      playPending.value = false;
    }
  }

  function goToArtist() {
    return navigateTo(artistTo.value);
  }

  return {
    interactive,
    artist: artistValue,
    isLgUp,
    artistTo,
    isLiked,
    moreOpen,
    isPlaying,
    playPending,
    nameLabel,
    onPlayClick,
    toggleLike,
    goToArtist,
  };
}
