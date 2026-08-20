/**
 * useArtistCard — shared play / like / more / labels for artist cards.
 */
import type { MaybeRefOrGetter } from "vue";
import type { Artist } from "~/types/artist";
import { useMediaQuery } from "@vueuse/core";

export function useArtistCard(
  artist: MaybeRefOrGetter<Artist>,
  options: { interactive?: MaybeRefOrGetter<boolean> } = {},
) {
  const playerStore = usePlayerStore();

  /** Tailwind lg — which layout hosts ArtistMoreMenu */
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const artistValue = computed(() => toValue(artist));

  const artistTo = computed(() => {
    const id = artistValue.value?.id;
    return id ? `/user/${id}` : "/";
  });

  const isLiked = ref(false);
  watch(
    () => artistValue.value?.isLiked,
    (value) => {
      if (value != null) isLiked.value = value;
    },
    { immediate: true },
  );
  const moreOpen = ref(false);
  const isPlaying = ref(false);

  const nameLabel = computed(() => artistValue.value?.name ?? "Artist");

  /** Keep desktop overlay visible while menu is open */
  const showDesktopActions = computed(() => moreOpen.value);

  function onPlayClick() {
    if (!interactive.value) return;
    isPlaying.value = !isPlaying.value;
    playerStore.isPlaying = isPlaying.value;
  }

  function toggleLike() {
    if (!interactive.value) return;
    isLiked.value = !isLiked.value;
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
    nameLabel,
    showDesktopActions,
    onPlayClick,
    toggleLike,
    goToArtist,
  };
}
