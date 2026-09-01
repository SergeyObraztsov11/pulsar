/**
 * usePlaylistCard — play and labels for playlist cards.
 */
import { PhListHeart, PhQueue } from "@phosphor-icons/vue";
import type { MaybeRefOrGetter } from "vue";
import type { PlaylistDetail, PlaylistSummary } from "~/types/playlist";
import { isSameQueueSource } from "~/stores/player";
import { playlistPath } from "~/utils/catalogPaths";
import { formatCountRu } from "~/utils/pluralizeRu";

export function usePlaylistCard(
  playlist: MaybeRefOrGetter<PlaylistSummary>,
  options: { interactive?: MaybeRefOrGetter<boolean> } = {},
) {
  const playerStore = usePlayerStore();

  const interactive = computed(() => toValue(options.interactive) ?? true);
  const playlistValue = computed(() => toValue(playlist));

  const playPending = ref(false);

  const isCurrentPlaylist = computed(() => {
    const id = playlistValue.value?.id;
    if (!id) return false;
    return isSameQueueSource(playerStore.queueSource, { type: "playlist", id });
  });

  const isPlaying = computed(
    () => isCurrentPlaylist.value && playerStore.isPlaying,
  );

  const nameLabel = computed(() => playlistValue.value?.name ?? "Playlist");

  const metaLabel = computed(() => {
    const count = playlistValue.value?.trackCount ?? 0;
    return formatCountRu(count, "трек", "трека", "треков");
  });

  const coverIcon = computed(() =>
    playlistValue.value?.systemKind === "liked_tracks" ? PhListHeart : PhQueue,
  );

  const playlistTo = computed(() => {
    const value = playlistValue.value;
    if (!value?.id || !value.userId) return "/";
    return playlistPath(value);
  });

  const showDesktopActions = computed(() => playPending.value || isPlaying.value);

  async function onPlayClick() {
    if (!interactive.value) return;
    const id = playlistValue.value?.id;
    if (!id) return;
    if (isCurrentPlaylist.value) {
      playerStore.togglePlaying();
      return;
    }
    playPending.value = true;
    try {
      const detail = await $fetch<PlaylistDetail>(`/api/playlists/${id}`);
      const first = detail.tracks.find((track) => Boolean(track.audioSrc));
      if (!first) return;
      playerStore.play(first, detail.tracks, {
        type: "playlist",
        id: detail.id,
        title: detail.name,
      });
    } catch {
      // Playlist unavailable — ignore play from card
    } finally {
      playPending.value = false;
    }
  }

  function goToPlaylist() {
    return navigateTo(playlistTo.value);
  }

  return {
    interactive,
    playlist: playlistValue,
    playlistTo,
    isPlaying,
    playPending,
    nameLabel,
    metaLabel,
    coverIcon,
    showDesktopActions,
    onPlayClick,
    goToPlaylist,
  };
}
