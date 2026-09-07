<script setup lang="ts">
/**
 * Плейлист — шапка и треклист.
 * Данные: GET /api/playlists/:id; владелец — GET /api/artists/:ownerId (lazy).
 */
import {
  PhArrowDown,
  PhArrowUp,
  PhCaretUp,
  PhCheck,
  PhDotsSixVertical,
  PhDotsThree,
  PhHeart,
  PhListHeart,
  PhPause,
  PhPlay,
  PhQueue,
  PhSortAscending,
  PhSortDescending,
  PhUser,
} from "@phosphor-icons/vue";
import ModalPlaylistSettings, {
  type ModalPlaylistSettingsProps,
} from "~/components/modals/ModalPlaylistSettings.vue";
import type { MenuItem } from "~/components/menus/menu.types";
import type { ArtistDetail } from "~/types/artist";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import type { PlaylistDetail } from "~/types/playlist";

import { isSameQueueSource } from "~/stores/player";
import { formatDurationRu } from "~/utils/formatDuration";
import { formatUpdatedAtLabel } from "~/utils/formatUpdatedAt";
import { formatCountRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "app-layout",
  pageTransition: false,
  key: (route) => `playlist-${route.params.userId}-${route.params.playlistId}`,
});

const route = useRoute();
const playlistId = computed(() => String(route.params.playlistId ?? ""));
const { user } = useUserSession();
const { open: openModal } = useModal();

const { data: playlist, error } = await useFetch<PlaylistDetail>(
  () => `/api/playlists/${playlistId.value}`,
  { key: computed(() => `playlist:${playlistId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? ApiErrorCode.PLAYLIST_NOT_FOUND,
    fatal: true,
  });
}

const isOwnPlaylist = computed(
  () =>
    Boolean(user.value?.id) &&
    Boolean(playlist.value?.userId) &&
    user.value?.id === playlist.value?.userId,
);

const canEditPlaylist = computed(
  () => isOwnPlaylist.value && !playlist.value?.isSystem,
);

/** DnD: свой плейлист + desktop; кнопка «Порядок» в шапке справа */
const isLgUp = useLgUp();
const canReorderTracks = computed(() => isOwnPlaylist.value && isLgUp.value);
const dndMode = ref(false);

watch(canReorderTracks, (ok) => {
  if (!ok) dndMode.value = false;
});

type PlaylistSortField = "order" | "name" | "duration";
type PlaylistSortDir = "asc" | "desc";

const sortOpen = ref(false);
const playlistSortField = ref<PlaylistSortField>("order");
const playlistSortDir = ref<PlaylistSortDir>("asc");

watch(dndMode, (on) => {
  if (on) sortOpen.value = false;
});

/** Поле сортировки; повторный клик по name/duration — смена направления */
function selectSortField(field: PlaylistSortField) {
  if (field === "order") {
    playlistSortField.value = "order";
    playlistSortDir.value = "asc";
    return;
  }
  // Сортировка view — выходим из DnD
  dndMode.value = false;
  if (playlistSortField.value === field) {
    playlistSortDir.value = playlistSortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  playlistSortField.value = field;
  playlistSortDir.value = "asc";
}

function toggleDndMode() {
  if (!canReorderTracks.value) return;
  if (!dndMode.value) {
    // DnD только в порядке плейлиста
    playlistSortField.value = "order";
    playlistSortDir.value = "asc";
  }
  dndMode.value = !dndMode.value;
}

const canToggleSortDir = computed(() => playlistSortField.value !== "order");

const sortLabel = computed(() => {
  if (playlistSortField.value === "name") return "По названию";
  if (playlistSortField.value === "duration") return "По длительности";
  return "По порядку";
});

const sortItems = computed<MenuItem[]>(() => {
  const field = playlistSortField.value;
  const dir = playlistSortDir.value;

  const item = (id: PlaylistSortField, label: string): MenuItem => {
    const selected = field === id;
    const showArrow = selected && id !== "order";

    return {
      id,
      label,
      icon: showArrow ? (dir === "desc" ? PhArrowDown : PhArrowUp) : PhCheck,
      iconClass: selected ? "text-tone-white" : "text-transparent",
      keepOpen: true,
      onClick: () => {
        selectSortField(id);
      },
    };
  };

  return [
    item("order", "По порядку"),
    item("name", "По названию"),
    item("duration", "По длительности"),
  ];
});

/** Клиентская сортировка списка (порядок API не меняет) */
const sortedTracks = computed(() => {
  const tracks = playlist.value?.tracks;
  if (tracks == null) return [];
  if (playlistSortField.value === "order") return tracks;

  const dir = playlistSortDir.value === "asc" ? 1 : -1;
  if (playlistSortField.value === "name") {
    return [...tracks].sort((a, b) => a.name.localeCompare(b.name, "ru") * dir);
  }
  return [...tracks].sort(
    (a, b) => ((a.durationSec ?? 0) - (b.durationSec ?? 0)) * dir,
  );
});

const ownerId = computed(() => playlist.value?.userId ?? "");

const { data: owner } = await useFetch<ArtistDetail>(
  () => `/api/artists/${ownerId.value}`,
  {
    key: computed(() => `artist:${ownerId.value}`),
    lazy: true,
    watch: [ownerId],
  },
);

const ownerTo = computed(() => `/user/${ownerId.value}`);

const coverIcon = computed(() =>
  playlist.value?.systemKind === "liked_tracks" ? PhListHeart : PhQueue,
);

const hasDescription = computed(() =>
  Boolean(playlist.value?.description?.trim()),
);

const updatedAtLabel = computed(() =>
  formatUpdatedAtLabel(playlist.value?.updatedAt),
);

const trackCountLabel = computed(() => {
  const count = playlist.value?.trackCount ?? 0;
  return formatCountRu(count, "трек", "трека", "треков");
});

const totalDurationSec = computed(() =>
  (playlist.value?.tracks ?? []).reduce(
    (sum, track) => sum + (track.durationSec ?? 0),
    0,
  ),
);

const totalDurationLabel = computed(() =>
  formatDurationRu(totalDurationSec.value),
);

const playerStore = usePlayerStore();

const isCurrentPlaylist = computed(() => {
  const id = playlist.value?.id;
  if (!id) return false;
  return isSameQueueSource(playerStore.queueSource, {
    type: "playlist",
    id,
  });
});

const isPlayingPlaylist = computed(
  () => isCurrentPlaylist.value && playerStore.isPlaying,
);

/** Есть что поставить в очередь */
const canListen = computed(() =>
  Boolean(playlist.value?.tracks?.some((track) => Boolean(track.audioSrc))),
);

/** Фон hero: coverColor своей обложки + мягкая тень к tone-canvas */
const heroBgStyle = computed(() => {
  const color = playlist.value?.coverColor?.trim();
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return {
    backgroundImage: `linear-gradient(to bottom, ${color} 0%, ${color} 55%, color-mix(in srgb, ${color} 70%, var(--color-tone-canvas)) 100%)`,
  };
});

/** Компактный хедер — нижний тон градиента */
const compactHeaderStyle = computed(() => {
  const color = playlist.value?.coverColor?.trim();
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return {
    backgroundColor: `color-mix(in srgb, ${color} 70%, var(--color-tone-canvas))`,
  };
});

const moreOpen = ref(false);

const heroRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

/** Макс. размер названия: mobile text-5xl, desktop text-8xl */
const lgUp = useLgUp();
const titleMaxPx = computed(() => (lgUp.value ? 96 : 48));

const { style: titleFitStyle } = useFitText(titleRef, {
  maxPx: titleMaxPx,
  minPx: 24,
  watchSources: [() => playlist.value?.name],
});

const showCompactHeader = ref(false);

/** Компактный хедер: показываем, когда большая шапка ушла из видимости */
onMounted(() => {
  const hero = heroRef.value;
  const scrollRoot = hero?.closest("main");
  if (!hero || !scrollRoot) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry) showCompactHeader.value = !entry.isIntersecting;
    },
    { root: scrollRoot, threshold: 0 },
  );

  observer.observe(hero);
  onUnmounted(() => observer.disconnect());
});

/** Листать main вверх к шапке плейлиста */
function scrollToTop() {
  const scrollRoot = heroRef.value?.closest("main");
  scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
}

/** Треки уже на странице — без второго запроса */
function onListenClick() {
  if (!canListen.value) return;
  const detail = playlist.value;
  if (!detail) return;
  if (isCurrentPlaylist.value) {
    playerStore.togglePlaying();
    return;
  }
  const first = detail.tracks.find((track) => Boolean(track.audioSrc));
  if (!first) return;
  playerStore.play(first, detail.tracks, {
    type: "playlist",
    id: detail.id,
    title: detail.name,
  });
}

function onPlaylistSaved(next: PlaylistDetail) {
  playlist.value = next;
}

function onSettingsClick() {
  const detail = playlist.value;
  if (!detail || !canEditPlaylist.value) return;

  openModal<ModalPlaylistSettingsProps>({
    component: ModalPlaylistSettings,
    props: {
      playlist: detail,
      onSaved: onPlaylistSaved,
    },
  });
}

/** Поделиться ссылкой на плейлист */
async function onShareClick() {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = playlist.value?.name ?? "Плейлист";
  if (!url) return;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // отмена шаринга
    }
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // clipboard недоступен
  }
}
</script>

<template>
  <div>
    <!-- Шапка плейлиста: mobile — колонка, desktop — ряд как альбом -->
    <header
      ref="heroRef"
      class="relative flex shrink-0 flex-col items-center gap-4 overflow-hidden rounded-t-lg bg-tone-surface p-4 text-tone-white sm:gap-5 sm:p-5 lg:flex-row lg:items-end lg:gap-6 lg:p-6"
      :style="heroBgStyle"
    >
      <div
        class="flex size-48 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-tone-shell text-tone-white shadow-2xl sm:size-56 sm:rounded-2xl lg:size-64"
      >
        <UiCoverImage
          :src="playlist?.coverSrc"
          :alt="playlist?.name"
          :icon="coverIcon"
        />
      </div>

      <div class="flex w-full min-w-0 flex-1 flex-col gap-3">
        <!-- Название: максимум, уменьшается только если не влезает в строку -->
        <h1
          ref="titleRef"
          class="w-full min-w-0 text-center font-extrabold leading-none lg:text-left"
          :style="titleFitStyle"
        >
          {{ playlist?.name }}
        </h1>

        <!-- Mobile: ник автора отдельно под названием -->
        <NuxtLink
          :to="ownerTo"
          class="mx-auto inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-tone-white hover:text-tone-muted lg:hidden"
        >
          <div
            class="size-6 shrink-0 overflow-hidden rounded-full bg-tone-shell"
          >
            <UiCoverImage
              :src="owner?.avatarSrc"
              :icon="PhUser"
              :alt="owner?.name ?? 'Владелец'"
            />
          </div>
          <span class="truncate">{{ owner?.name ?? "…" }}</span>
        </NuxtLink>

        <!-- Описание -->
        <p
          v-if="hasDescription"
          class="mx-auto line-clamp-2 max-w-prose text-center text-base text-tone-white lg:mx-0 lg:text-left"
        >
          {{ playlist?.description }}
        </p>

        <!-- Мета: на desktop — с владельцем; на mobile — без (ник выше) -->
        <div class="flex min-w-0 justify-center overflow-x-hidden lg:justify-start">
          <div
            class="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-tone-white lg:w-max lg:flex-nowrap lg:justify-start lg:whitespace-nowrap"
          >
            <NuxtLink
              :to="ownerTo"
              class="hidden shrink-0 items-center gap-1.5 font-bold hover:text-tone-muted lg:inline-flex"
            >
              <div
                class="size-6 shrink-0 overflow-hidden rounded-full bg-tone-shell"
              >
                <UiCoverImage
                  :src="owner?.avatarSrc"
                  :icon="PhUser"
                  :alt="owner?.name ?? 'Владелец'"
                />
              </div>
              <span>{{ owner?.name ?? "…" }}</span>
            </NuxtLink>
            <span class="hidden lg:inline" aria-hidden="true">·</span>
            <template v-if="updatedAtLabel">
              <span>{{ updatedAtLabel }}</span>
              <span aria-hidden="true">·</span>
            </template>
            <span>{{ trackCountLabel }}</span>
            <template v-if="totalDurationLabel">
              <span aria-hidden="true">·</span>
              <span>{{ totalDurationLabel }}</span>
            </template>
          </div>
        </div>

        <!-- Действия: mobile — Слушать + like + more по центру; desktop — + сортировка -->
        <div
          class="flex w-full items-center justify-center gap-4 lg:justify-start lg:gap-6"
        >
          <button
            type="button"
            class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-tone-white px-5 text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100 disabled:pointer-events-none disabled:opacity-40 lg:size-14 lg:px-0"
            :aria-label="isPlayingPlaylist ? 'Пауза' : 'Слушать плейлист'"
            :disabled="!canListen"
            @click="onListenClick"
          >
            <PhPause v-if="isPlayingPlaylist" :size="28" weight="fill" />
            <PhPlay v-else :size="28" weight="fill" />
            <span class="text-sm font-medium leading-none lg:hidden">
              {{ isPlayingPlaylist ? "Пауза" : "Слушать" }}
            </span>
          </button>

          <div class="flex items-center gap-4">
            <!-- Лайк плейлиста — заглушка, API пока нет -->
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted lg:size-12"
              aria-label="В любимое"
              aria-pressed="false"
            >
              <PhHeart :size="32" weight="light" />
            </button>

            <PlaylistMoreMenu
              v-model:open="moreOpen"
              :is-playing="isPlayingPlaylist"
              :can-edit="canEditPlaylist"
              @play="onListenClick"
              @settings="onSettingsClick"
              @go-owner="() => navigateTo(ownerTo)"
              @share="onShareClick"
            >
              <template #trigger>
                <button
                  type="button"
                  class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted lg:size-12"
                  aria-label="Ещё"
                >
                  <PhDotsThree :size="32" weight="bold" />
                </button>
              </template>
            </PlaylistMoreMenu>
          </div>

          <div class="ml-auto hidden min-w-0 items-center gap-1 lg:flex">
            <button
              v-if="canReorderTracks"
              type="button"
              class="inline-flex h-12 shrink-0 items-center gap-2 rounded-full px-3 text-tone-white transition-colors duration-200 hover:text-tone-muted"
              :aria-pressed="dndMode"
              :aria-label="
                dndMode
                  ? 'Выйти из режима перестановки'
                  : 'Изменить порядок треков'
              "
              @click="toggleDndMode"
            >
              <PhDotsSixVertical
                :size="28"
                :weight="dndMode ? 'fill' : 'light'"
                class="shrink-0"
              />
              <span class="leading-none">
                {{ dndMode ? "Готово" : "Порядок" }}
              </span>
            </button>

            <MenuResponsive
              v-if="!dndMode"
              v-model:open="sortOpen"
              :items="sortItems"
            >
              <template #trigger>
                <button
                  type="button"
                  class="inline-flex h-12 max-w-full shrink-0 items-center gap-2 rounded-full pl-3 pr-1 text-tone-white transition-colors duration-200 hover:text-tone-muted"
                  :aria-label="`Сортировка: ${sortLabel}`"
                  :aria-expanded="sortOpen"
                >
                  <span class="truncate leading-none">
                    {{ sortLabel }}
                  </span>
                  <PhSortDescending
                    v-if="canToggleSortDir && playlistSortDir === 'desc'"
                    :size="28"
                    weight="light"
                    class="shrink-0"
                  />
                  <PhSortAscending
                    v-else
                    :size="28"
                    weight="light"
                    class="shrink-0"
                  />
                </button>
              </template>
            </MenuResponsive>
          </div>
        </div>
      </div>
    </header>

    <!-- Компактный хедер: overlay, не сдвигает layout -->
    <div class="sticky top-0 z-12 h-0">
      <div
        class="absolute inset-x-0 top-0 flex h-14 items-center gap-3 bg-tone-surface px-4 transition-opacity duration-200 motion-reduce:transition-none lg:px-6"
        :class="
          showCompactHeader ? 'opacity-100' : 'pointer-events-none opacity-0'
        "
        :style="compactHeaderStyle"
        :aria-hidden="!showCompactHeader"
      >
        <!-- Play только на desktop -->
        <button
          type="button"
          class="hidden size-8 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-opacity duration-200 hover:opacity-90 disabled:pointer-events-none disabled:opacity-40 lg:flex"
          :aria-label="isPlayingPlaylist ? 'Пауза' : 'Слушать плейлист'"
          :disabled="!canListen"
          @click="onListenClick"
        >
          <PhPause v-if="isPlayingPlaylist" :size="16" weight="fill" />
          <PhPlay v-else :size="16" weight="fill" />
        </button>

        <p class="min-w-0 flex-1 truncate text-base font-bold text-tone-white">
          {{ playlist?.name }}
        </p>

        <button
          type="button"
          class=" text-tone-white transition-colors duration-200 hover:text-tone-muted"
          aria-label="Наверх"
          @click="scrollToTop"
        >
          <PhCaretUp :size="24" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Треклист: ClientOnly — нет SSR/hydration mismatch из‑за media query в карточках -->
    <section class="flex flex-col gap-16 p-6">
      <ClientOnly>
        <PlaylistTracksReorderList
          v-if="playlist"
          :playlist-id="playlist.id"
          :tracks="sortedTracks"
          :order-tracks="playlist.tracks"
          :dnd-mode="dndMode"
          :queue-source="{
            type: 'playlist',
            id: playlist.id,
            title: playlist.name,
          }"
          @update:tracks="(tracks) => (playlist!.tracks = tracks)"
        />
      </ClientOnly>
    </section>
  </div>
</template>
