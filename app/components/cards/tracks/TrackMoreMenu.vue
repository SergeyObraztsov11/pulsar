<script setup lang="ts">
/**
 * TrackMoreMenu — track “⋯” actions via MenuResponsive.
 * Playlist flyout: Мне нравится → user playlists → Создать плейлист.
 */
import {
  PhDisc,
  PhFlag,
  PhHeart,
  PhListPlus,
  PhMinus,
  PhPause,
  PhPlay,
  PhPlus,
  PhShareNetwork,
  PhUser,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";
import type { PlaylistSummary } from "~/types/playlist";
import { setLikeState } from "~/composables/useLike";
import ModalCreatePlaylist, {
  type ModalCreatePlaylistProps,
} from "~/components/modals/ModalCreatePlaylist.vue";

const LIKED_PLAYLIST_MENU_LABEL = "Мне нравится";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  trackId: string;
  albumTo: string;
  artistTo: string;
  isPlayingCurrent: boolean;
  isLiked: boolean;
}>();

const emit = defineEmits<{
  play: [];
  "toggle-like": [];
}>();

const router = useRouter();
const { open: openModal } = useModal();

const trackIdRef = computed(() => props.trackId);
const {
  playlists,
  pending,
  error,
  refresh,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
} = useUserPlaylists(trackIdRef);

/** Локальное членство трека в плейлистах (optimistic) */
const membership = ref<Record<string, boolean>>({});
const busyPlaylistId = ref<string | null>(null);

watch(open, (isOpen) => {
  if (isOpen && props.trackId) void refresh();
});

watch(
  playlists,
  (list) => {
    if (!list) return;
    const next: Record<string, boolean> = {};
    for (const playlist of list) {
      if (playlist.containsTrack) next[playlist.id] = true;
    }
    membership.value = next;
  },
  { immediate: true },
);

function playlistLabel(playlist: PlaylistSummary): string {
  if (playlist.systemKind === "liked_tracks") return LIKED_PLAYLIST_MENU_LABEL;
  return playlist.name;
}

function isTrackInPlaylist(playlistId: string): boolean {
  return membership.value[playlistId] === true;
}

function setMembership(playlistId: string, contains: boolean) {
  membership.value = { ...membership.value, [playlistId]: contains };
}

function syncLikedPlaylistState(playlist: PlaylistSummary, contains: boolean) {
  if (playlist.systemKind !== "liked_tracks") return;
  setLikeState("track", props.trackId, contains);
}

/** Toggle track in playlist; клик по всей строке */
async function togglePlaylistTrack(playlist: PlaylistSummary) {
  if (!props.trackId || busyPlaylistId.value) return;

  const inPlaylist = isTrackInPlaylist(playlist.id);
  busyPlaylistId.value = playlist.id;

  try {
    if (inPlaylist) {
      await removeTrackFromPlaylist(playlist.id, props.trackId);
      setMembership(playlist.id, false);
      syncLikedPlaylistState(playlist, false);
    } else {
      await addTrackToPlaylist(playlist.id, props.trackId);
      setMembership(playlist.id, true);
      syncLikedPlaylistState(playlist, true);
    }
  } catch {
    // keep menu open
  } finally {
    busyPlaylistId.value = null;
  }
}

function buildPlaylistRow(playlist: PlaylistSummary): MenuItem {
  const inPlaylist = isTrackInPlaylist(playlist.id);
  const busy = busyPlaylistId.value === playlist.id;
  const label = playlistLabel(playlist);

  return {
    id: `playlist-${playlist.id}`,
    label: busy ? `${label}…` : label,
    icon: inPlaylist ? PhMinus : PhPlus,
    labelClass: inPlaylist ? "text-primary-white" : undefined,
    onClick: () => void togglePlaylistTrack(playlist),
    keepOpen: true,
  };
}

function onCreatePlaylistClick() {
  open.value = false;
  openModal<ModalCreatePlaylistProps>({
    component: ModalCreatePlaylist,
    props: {
      trackId: props.trackId,
      onCreated: (playlist) => {
        setMembership(playlist.id, true);
        void refresh();
      },
    },
  });
}

const playlistChildren = computed<MenuItem[]>(() => {
  if (pending.value && playlists.value.length === 0) {
    return [{ id: "playlists-loading", label: "Загрузка…" }];
  }
  if (error.value) {
    return [
      {
        id: "playlists-error",
        label: "Не удалось загрузить",
        onClick: () => void refresh(),
      },
    ];
  }

  const list = playlists.value;
  const liked = list.find((p) => p.systemKind === "liked_tracks");
  const userPlaylists = list.filter((p) => p.systemKind !== "liked_tracks");

  const rows: MenuItem[] = [];
  if (liked) rows.push(buildPlaylistRow(liked));
  for (const playlist of userPlaylists) {
    rows.push(buildPlaylistRow(playlist));
  }

  rows.push({
    id: "create-playlist",
    label: "Создать плейлист",
    icon: PhListPlus,
    onClick: onCreatePlaylistClick,
  });

  return rows;
});

const items = computed<MenuItem[]>(() => [
  {
    id: "play",
    label: props.isPlayingCurrent ? "Пауза" : "Слушать",
    icon: props.isPlayingCurrent ? PhPause : PhPlay,
    onClick: () => emit("play"),
  },
  {
    id: "like",
    label: props.isLiked ? "Убрать из избранного" : "В избранное",
    icon: PhHeart,
    iconWeight: props.isLiked ? "fill" : "light",
    iconClass: props.isLiked ? "text-primary-white" : undefined,
    labelClass: props.isLiked ? "text-primary-white" : undefined,
    onClick: () => emit("toggle-like"),
  },
  {
    id: "playlist",
    label: "Добавить в плейлист",
    icon: PhListPlus,
    children: playlistChildren.value,
  },
  {
    id: "album",
    label: "Перейти к альбому",
    icon: PhDisc,
    onClick: () => void router.push(props.albumTo),
  },
  {
    id: "artist",
    label: "Перейти к артисту",
    icon: PhUser,
    onClick: () => void router.push(props.artistTo),
  },
  { id: "share", label: "Поделиться", icon: PhShareNetwork },
  { id: "report", label: "Пожаловаться", icon: PhFlag },
]);
</script>

<template>
  <MenuResponsive v-model:open="open" :items="items">
    <template #trigger="slotProps">
      <slot name="trigger" v-bind="slotProps" />
    </template>
  </MenuResponsive>
</template>
