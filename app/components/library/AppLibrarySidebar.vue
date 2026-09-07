<script setup lang="ts">
/**
 * Оболочка библиотеки: ширина, collapse/resize, данные.
 * UI: AppLibrarySidebarBig / AppLibrarySidebarSmall.
 */
import { PhCheck } from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";
import ModalCreatePlaylist, {
  type ModalCreatePlaylistProps,
} from "~/components/modals/ModalCreatePlaylist.vue";
import type { Album } from "~/types/album";
import type { Artist } from "~/types/artist";
import type { PlaylistSummary } from "~/types/playlist";

type LibraryKind = "playlists" | "albums" | "artists";
type LibrarySort = "recent" | "name" | "created" | "tracks";

const WIDTH_DEFAULT = 360;
const WIDTH_MIN = 240;
const WIDTH_MAX = 420;
const WIDTH_COLLAPSED = 72;
const COLLAPSE_THRESHOLD = 200;

const KIND_LABELS: Record<LibraryKind, string> = {
  playlists: "Плейлисты",
  albums: "Альбомы",
  artists: "Исполнители",
};

const SORT_LABELS: Record<LibrarySort, string> = {
  recent: "По недавним",
  name: "По названию",
  created: "По дате создания",
  tracks: "По числу треков",
};

const { user } = useUserSession();
const route = useRoute();
const { open: openModal } = useModal();

const userId = computed(() => user.value?.id ?? "");

const panelWidth = ref(WIDTH_DEFAULT);
const widthBeforeCollapse = ref(WIDTH_DEFAULT);
const collapsed = ref(false);
const isResizing = ref(false);

const asideWidth = computed(() => {
  if (isResizing.value) return panelWidth.value;
  return collapsed.value ? WIDTH_COLLAPSED : panelWidth.value;
});

/** Большой сайдбар (панель с текстом) */
const showPanel = computed(() => {
  if (isResizing.value) return panelWidth.value >= COLLAPSE_THRESHOLD;
  return !collapsed.value;
});

function clampWidth(width: number) {
  return Math.min(WIDTH_MAX, Math.max(WIDTH_MIN, width));
}

function collapse() {
  if (!collapsed.value) {
    widthBeforeCollapse.value = clampWidth(panelWidth.value);
  }
  collapsed.value = true;
}

function expand() {
  collapsed.value = false;
  panelWidth.value = clampWidth(widthBeforeCollapse.value);
}

function onResizeStart(event: PointerEvent) {
  if (event.button !== 0) return;

  event.preventDefault();
  isResizing.value = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  const startX = event.clientX;
  const startWidth = collapsed.value ? WIDTH_COLLAPSED : panelWidth.value;
  const wasCollapsed = collapsed.value;

  panelWidth.value = startWidth;

  function onMove(moveEvent: PointerEvent) {
    const next = startWidth + (moveEvent.clientX - startX);
    panelWidth.value = Math.min(
      WIDTH_MAX,
      Math.max(WIDTH_COLLAPSED, next),
    );
  }

  function onEnd() {
    isResizing.value = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onEnd);
    window.removeEventListener("pointercancel", onEnd);

    if (panelWidth.value < COLLAPSE_THRESHOLD) {
      if (!wasCollapsed) {
        widthBeforeCollapse.value = clampWidth(startWidth);
      }
      collapsed.value = true;
      return;
    }

    collapsed.value = false;
    panelWidth.value = clampWidth(panelWidth.value);
    widthBeforeCollapse.value = panelWidth.value;
  }

  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onEnd);
  window.addEventListener("pointercancel", onEnd);
}

const libraryKind = ref<LibraryKind>("playlists");
const kindOpen = ref(false);
const searchQuery = ref("");
const sortOpen = ref(false);
const librarySort = ref<LibrarySort>("recent");

const kindLabel = computed(() => KIND_LABELS[libraryKind.value]);
const sortLabel = computed(() => SORT_LABELS[librarySort.value]);

const kindItems = computed<MenuItem[]>(() => {
  const current = libraryKind.value;
  return (Object.keys(KIND_LABELS) as LibraryKind[]).map((id) => ({
    id,
    label: KIND_LABELS[id],
    icon: PhCheck,
    iconClass: current === id ? "text-tone-white" : "text-transparent",
    onClick: () => {
      libraryKind.value = id;
      searchQuery.value = "";
      if (id !== "playlists" && librarySort.value === "tracks") {
        librarySort.value = "recent";
      }
    },
  }));
});

const availableSorts = computed<LibrarySort[]>(() => {
  if (libraryKind.value === "playlists") {
    return ["recent", "name", "created", "tracks"];
  }
  if (libraryKind.value === "albums") {
    return ["recent", "name", "created"];
  }
  return ["recent", "name"];
});

const sortItems = computed<MenuItem[]>(() => {
  const current = librarySort.value;
  return availableSorts.value.map((id) => ({
    id,
    label: SORT_LABELS[id],
    icon: PhCheck,
    iconClass: current === id ? "text-tone-white" : "text-transparent",
    onClick: () => {
      librarySort.value = id;
    },
  }));
});

const {
  data: playlists,
  pending: playlistsPending,
  refresh: refreshPlaylists,
} = await useFetch<PlaylistSummary[]>("/api/playlists", {
  key: computed(() => `library-playlists:${userId.value || "anon"}`),
  immediate: Boolean(userId.value),
  watch: [userId],
});

const albumsSortParam = computed(() => {
  if (librarySort.value === "name") return "name";
  if (librarySort.value === "created") return "newest";
  return "likedAt";
});

const {
  data: albums,
  pending: albumsPending,
  refresh: refreshAlbums,
} = await useFetch<Album[]>(
  () => `/api/albums?liked=true&sort=${albumsSortParam.value}`,
  {
    key: computed(
      () => `library-albums:${userId.value || "anon"}:${albumsSortParam.value}`,
    ),
    immediate: false,
    watch: false,
  },
);

const artistsSortParam = computed(() =>
  librarySort.value === "name" ? "name" : "likedAt",
);

const {
  data: artists,
  pending: artistsPending,
  refresh: refreshArtists,
} = await useFetch<Artist[]>(
  () => `/api/artists?liked=true&sort=${artistsSortParam.value}`,
  {
    key: computed(
      () =>
        `library-artists:${userId.value || "anon"}:${artistsSortParam.value}`,
    ),
    immediate: false,
    watch: false,
  },
);

watch(
  [libraryKind, userId, albumsSortParam, artistsSortParam],
  async () => {
    if (!userId.value) return;
    if (libraryKind.value === "albums") await refreshAlbums();
    if (libraryKind.value === "artists") await refreshArtists();
  },
  { immediate: true },
);

function sortPlaylistList(list: PlaylistSummary[]) {
  const liked = list.filter((item) => item.systemKind === "liked_tracks");
  const rest = list.filter((item) => item.systemKind !== "liked_tracks");
  const sorted = [...rest];

  if (librarySort.value === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } else if (librarySort.value === "created") {
    sorted.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } else if (librarySort.value === "tracks") {
    sorted.sort((a, b) => b.trackCount - a.trackCount);
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }

  return [...liked, ...sorted];
}

function filterByQuery<T extends { name: string }>(list: T[]) {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter((item) => item.name.toLowerCase().includes(q));
}

const visiblePlaylists = computed(() =>
  sortPlaylistList(filterByQuery(playlists.value ?? [])),
);
const visibleAlbums = computed(() => filterByQuery(albums.value ?? []));
const visibleArtists = computed(() => filterByQuery(artists.value ?? []));

const isLoading = computed(() => {
  if (!userId.value) return false;
  if (libraryKind.value === "playlists") {
    return playlistsPending.value && playlists.value == null;
  }
  if (libraryKind.value === "albums") {
    return albumsPending.value && albums.value == null;
  }
  return artistsPending.value && artists.value == null;
});

const isEmpty = computed(() => {
  if (!userId.value || isLoading.value) return false;
  if (libraryKind.value === "playlists") {
    return (playlists.value?.length ?? 0) === 0;
  }
  if (libraryKind.value === "albums") {
    return (albums.value?.length ?? 0) === 0;
  }
  return (artists.value?.length ?? 0) === 0;
});

const listMessage = computed(() => {
  if (!userId.value) return "Войдите, чтобы видеть библиотеку.";
  if (isLoading.value) return null;
  if (isEmpty.value) {
    if (libraryKind.value === "albums") return "Нет любимых альбомов.";
    if (libraryKind.value === "artists") return "Нет любимых исполнителей.";
    return "Плейлистов пока нет. Нажмите «Создать».";
  }
  const count =
    libraryKind.value === "playlists"
      ? visiblePlaylists.value.length
      : libraryKind.value === "albums"
        ? visibleAlbums.value.length
        : visibleArtists.value.length;
  if (count === 0) return "Ничего не найдено.";
  return null;
});

const activePlaylistId = computed(() => {
  const id = route.params.playlistId;
  return typeof id === "string" ? id : null;
});

const activeAlbumId = computed(() => {
  const id = route.params.albumId;
  return typeof id === "string" ? id : null;
});

const activeArtistId = computed(() => {
  if (route.params.albumId || route.params.playlistId) return null;
  const id = route.params.userId;
  return typeof id === "string" ? id : null;
});

function onCreateClick() {
  openModal<ModalCreatePlaylistProps>({
    component: ModalCreatePlaylist,
    props: {
      onCreated: async () => {
        await refreshPlaylists();
        libraryKind.value = "playlists";
      },
    },
  });
}
</script>

<template>
  <div class="flex min-h-0 shrink-0 self-stretch">
    <aside
      class="min-h-0 shrink-0 self-stretch overflow-hidden rounded-lg bg-tone-canvas text-tone-white"
      :class="
        isResizing
          ? null
          : 'transition-[width] duration-200 motion-reduce:transition-none'
      "
      :style="{ width: `${asideWidth}px` }"
      aria-label="Библиотека"
    >
      <!-- Маленький сайдбар -->
      <AppLibrarySidebarSmall
        v-show="!showPanel"
        @expand="expand"
        @create="onCreateClick"
      />

      <!-- Большой сайдбар -->
      <AppLibrarySidebarBig
        v-show="showPanel"
        v-model:kind-open="kindOpen"
        v-model:sort-open="sortOpen"
        v-model:search-query="searchQuery"
        :kind="libraryKind"
        :kind-label="kindLabel"
        :sort-label="sortLabel"
        :kind-items="kindItems"
        :sort-items="sortItems"
        :playlists="visiblePlaylists"
        :albums="visibleAlbums"
        :artists="visibleArtists"
        :loading="isLoading"
        :list-message="listMessage"
        :active-playlist-id="activePlaylistId"
        :active-album-id="activeAlbumId"
        :active-artist-id="activeArtistId"
        @collapse="collapse"
        @create="onCreateClick"
      />
    </aside>

    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Изменить ширину боковой панели"
      class="group flex w-2 shrink-0 cursor-col-resize touch-none items-stretch justify-center"
      @pointerdown="onResizeStart"
    >
      <div
        class="w-px rounded-full bg-transparent transition-colors duration-150 group-hover:bg-tone-muted motion-reduce:transition-none"
        :class="isResizing ? 'bg-tone-muted' : null"
      />
    </div>
  </div>
</template>
