/**
 * useAlbumCard — shared play / like / more / labels for album cards.
 */
import type { MaybeRefOrGetter } from "vue";
import type { Album, AlbumDetail } from "~/types/album";
import ModalAlbumReport, {
  type ModalAlbumReportProps,
} from "~/components/modals/ModalAlbumReport.vue";
import ModalShareAlbum, {
  type ModalShareAlbumProps,
} from "~/components/modals/ModalShareAlbum.vue";
import { useMediaQuery } from "@vueuse/core";
import { isSameQueueSource } from "~/stores/player";

export function useAlbumCard(
  album: MaybeRefOrGetter<Album>,
  options: { interactive?: MaybeRefOrGetter<boolean> } = {},
) {
  const playerStore = usePlayerStore();
  const { open: openModal } = useModal();

  /** Tailwind lg — which layout hosts AlbumMoreMenu */
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const albumValue = computed(() => toValue(album));

  const isLiked = ref(false);
  watch(
    () => albumValue.value?.isLiked,
    (value) => {
      if (value != null) isLiked.value = value;
    },
    { immediate: true },
  );

  const moreOpen = ref(false);
  const playPending = ref(false);

  const isCurrentAlbum = computed(() => {
    const id = albumValue.value?.id;
    if (!id) return false;
    return isSameQueueSource(playerStore.queueSource, { type: "album", id });
  });

  const isPlaying = computed(
    () => isCurrentAlbum.value && playerStore.isPlaying,
  );

  const nameLabel = computed(() => albumValue.value?.name ?? "Album");
  const artistLabel = computed(
    () => albumValue.value?.artist?.name ?? "Artist",
  );

  const albumTo = computed(() => {
    const value = albumValue.value;
    const artistId = value?.artist?.id;
    if (!value?.id || !artistId) return "/";
    return `/user/${artistId}/album/${value.id}`;
  });

  const artistTo = computed(() => {
    const artistId = albumValue.value?.artist?.id;
    return artistId ? `/user/${artistId}` : "/";
  });

  /** Keep desktop overlay visible while menu is open */
  const showDesktopActions = computed(() => moreOpen.value);

  async function onPlayClick() {
    if (!interactive.value) return;
    const id = albumValue.value?.id;
    if (!id) return;
    if (isCurrentAlbum.value) {
      playerStore.togglePlaying();
      return;
    }
    playPending.value = true;
    try {
      const detail = await $fetch<AlbumDetail>(`/api/albums/${id}`);
      const first = detail.tracks.find((track) => Boolean(track.audioSrc));
      if (!first) return;
      playerStore.play(first, detail.tracks, { type: "album", id });
    } finally {
      playPending.value = false;
    }
  }

  function toggleLike() {
    if (!interactive.value) return;
    isLiked.value = !isLiked.value;
  }

  function openShare() {
    openModal<ModalShareAlbumProps>({
      component: ModalShareAlbum,
      props: { albumName: nameLabel.value },
    });
  }

  function openReport() {
    openModal<ModalAlbumReportProps>({
      component: ModalAlbumReport,
      props: { albumName: nameLabel.value },
    });
  }

  function goToAlbum() {
    return navigateTo(albumTo.value);
  }

  function goToArtist() {
    return navigateTo(artistTo.value);
  }

  return {
    interactive,
    album: albumValue,
    isLgUp,
    albumTo,
    artistTo,
    isLiked,
    moreOpen,
    isPlaying,
    playPending,
    nameLabel,
    artistLabel,
    showDesktopActions,
    onPlayClick,
    toggleLike,
    openShare,
    openReport,
    goToAlbum,
    goToArtist,
  };
}
