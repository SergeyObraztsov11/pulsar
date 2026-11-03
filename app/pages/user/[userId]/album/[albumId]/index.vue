<script setup lang="ts">
/**
 * Альбом — шапка, треклист, полка других альбомов артиста.
 * Данные: GET /api/albums/:id; ниже — другие альбомы этого артиста.
 */
import {
  PhUser,
  PhPlay,
  PhPause,
  PhDotsThree,
  PhHeart,
  PhSortAscending,
  PhSortDescending,
  PhCheck,
  PhNotePencil,
  PhArrowUp,
  PhArrowDown,
  PhCaretUp,
} from "@phosphor-icons/vue";
import type { MenuItem } from "~/components/menus/menu.types";
import type { Album, AlbumDetail } from "~/types/album";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import { isSameQueueSource } from "~/stores/player";
import { formatDurationRu } from "~/utils/formatDuration";
import { formatCompactCount } from "~/utils/formatCompactCount";
import { formatListenersLabel } from "~/utils/formatListenersLabel";
import { formatCountRu } from "~/utils/pluralizeRu";
import ModalAlbumReport, {
  type ModalAlbumReportProps,
} from "~/components/modals/ModalAlbumReport.vue";
import ModalShareAlbum, {
  type ModalShareAlbumProps,
} from "~/components/modals/ModalShareAlbum.vue";

definePageMeta({
  layout: "app-layout",
  pageTransition: false,
  key: (route) => `album-${route.params.userId}-${route.params.albumId}`,
});

const route = useRoute();
const { open: openModal } = useModal();
const { user } = useUserSession();
const albumId = computed(() => String(route.params.albumId ?? ""));

const { data: album, error } = await useFetch<AlbumDetail>(
  () => `/api/albums/${albumId.value}`,
  { key: computed(() => `album:${albumId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? ApiErrorCode.ALBUM_NOT_FOUND,
    fatal: true,
  });
}

/** Свой альбом — кнопка редактирования у названия */
const isOwnAlbum = computed(
  () =>
    Boolean(user.value?.id) &&
    Boolean(album.value?.artist.id) &&
    user.value?.id === album.value?.artist.id,
);

const albumIdForLike = computed(() => album.value?.id);
const { isLiked, toggleLike } = useLike("album", albumIdForLike, {
  initial: computed(() => album.value?.isLiked),
});

const moreOpen = ref(false);
const sortOpen = ref(false);

type AlbumSortField = "order" | "name" | "duration";
type AlbumSortDir = "asc" | "desc";

const albumSortField = ref<AlbumSortField>("order");
const albumSortDir = ref<AlbumSortDir>("asc");

/** Поле сортировки; повторный клик по name/duration — смена направления */
function selectSortField(field: AlbumSortField) {
  if (field === "order") {
    albumSortField.value = "order";
    albumSortDir.value = "asc";
    return;
  }
  if (albumSortField.value === field) {
    albumSortDir.value = albumSortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  albumSortField.value = field;
  albumSortDir.value = "asc";
}

const canToggleSortDir = computed(() => albumSortField.value !== "order");

/** Подпись текущей сортировки слева от кнопки */
const sortLabel = computed(() => {
  if (albumSortField.value === "name") return "По названию";
  if (albumSortField.value === "duration") return "По длительности";
  return "По порядку";
});

const sortItems = computed<MenuItem[]>(() => {
  const field = albumSortField.value;
  const dir = albumSortDir.value;

  const item = (id: AlbumSortField, label: string): MenuItem => {
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

const sortedTracks = computed(() => {
  const tracks = album.value?.tracks;
  if (tracks == null) return null;
  if (albumSortField.value === "order") return tracks;

  const dir = albumSortDir.value === "asc" ? 1 : -1;
  if (albumSortField.value === "name") {
    return [...tracks].sort((a, b) => a.name.localeCompare(b.name, "ru") * dir);
  }
  return [...tracks].sort((a, b) => (a.durationSec - b.durationSec) * dir);
});

const artistId = computed(() => album.value?.artist.id ?? "");

/** Другие альбомы артиста — GET /api/artists/:id */
const { data: artist } = await useFetch<{ albums: Album[] }>(
  () => `/api/artists/${artistId.value}`,
  {
    key: computed(() => `artist:${artistId.value}`),
    lazy: true,
  },
);

const artistAlbums = computed(() => {
  if (artist.value == null) return null;
  return artist.value.albums.filter((item) => item.id !== albumId.value);
});

const artistTo = computed(() =>
  album.value ? `/user/${album.value.artist.id}` : "/",
);

const albumTo = computed(() => {
  const value = album.value;
  const artist = value?.artist.id;
  if (!value?.id || !artist) return "/";
  return `/user/${artist}/album/${value.id}`;
});

const releaseYear = computed(() => {
  const raw = album.value?.releaseDate ?? album.value?.createdAt;
  if (!raw) return null;
  const year = new Date(raw).getFullYear();
  return Number.isNaN(year) ? null : year;
});

/** «1 трек» / «2 трека» / «5 треков» */
const trackCountLabel = computed(() => {
  const count = album.value?.trackCount ?? 0;
  return formatCountRu(count, "трек", "трека", "треков");
});

/** Общая длительность альбома */
const totalDurationLabel = computed(() =>
  formatDurationRu(album.value?.totalDurationSec ?? 0),
);

/** «Нет слушателей» / «1,2 млн слушателей» */
const listenersLabel = computed(() =>
  formatListenersLabel(album.value?.listenersCount),
);

/** Число лайков; ±1 при toggle на странице */
const likesCount = computed(() => {
  let count = album.value?.likesCount ?? 0;
  const serverLiked = album.value?.isLiked ?? false;
  if (isLiked.value !== serverLiked) {
    count += isLiked.value ? 1 : -1;
  }
  return Math.max(0, count);
});

const likesCountButtonLabel = computed(() =>
  formatCompactCount(likesCount.value),
);

/** Полку скрываю только когда точно знаю, что других альбомов нет */
const showArtistAlbums = computed(
  () => artistAlbums.value == null || artistAlbums.value.length > 0,
);

const playerStore = usePlayerStore();

const isCurrentAlbum = computed(() => {
  const id = album.value?.id;
  if (!id) return false;
  return isSameQueueSource(playerStore.queueSource, { type: "album", id });
});

const isPlayingAlbum = computed(
  () => isCurrentAlbum.value && playerStore.isPlaying,
);

/** Треклист уже на странице — без второго запроса */
function onListenClick() {
  const detail = album.value;
  if (!detail) return;
  if (isCurrentAlbum.value) {
    playerStore.togglePlaying();
    return;
  }
  const first = detail.tracks.find((track) => Boolean(track.audioSrc));
  if (!first) return;
  playerStore.play(first, detail.tracks, {
    type: "album",
    id: detail.id,
    title: detail.name,
  });
}

function openShare() {
  openModal<ModalShareAlbumProps>({
    component: ModalShareAlbum,
    props: { albumName: album.value?.name ?? "Album" },
  });
}

function openReport() {
  openModal<ModalAlbumReportProps>({
    component: ModalAlbumReport,
    props: { albumName: album.value?.name ?? "Album" },
  });
}

/** Фон hero: coverColor + мягкая тень к tone-canvas */
const heroBgStyle = computed(() => {
  const color = album.value?.coverColor?.trim();
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return {
    backgroundImage: `linear-gradient(to bottom, ${color} 0%, ${color} 55%, color-mix(in srgb, ${color} 70%, var(--color-tone-canvas)) 100%)`,
  };
});

/** Компактный хедер — нижний тон градиента */
const compactHeaderStyle = computed(() => {
  const color = album.value?.coverColor?.trim();
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return {
    backgroundColor: `color-mix(in srgb, ${color} 70%, var(--color-tone-canvas))`,
  };
});

const heroRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

/** Макс. размер названия: mobile text-5xl, desktop text-8xl */
const lgUp = useLgUp();
const titleMaxPx = computed(() => (lgUp.value ? 96 : 48));

const { style: titleFitStyle } = useFitText(titleRef, {
  maxPx: titleMaxPx,
  minPx: 24,
  watchSources: [() => album.value?.name],
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

/** Листать main вверх к шапке альбома */
function scrollToTop() {
  const scrollRoot = heroRef.value?.closest("main");
  scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <div>
    <!-- Шапка альбома: mobile — колонка, desktop — ряд -->
    <header
      ref="heroRef"
      class="relative flex shrink-0 flex-col items-center gap-4 overflow-hidden rounded-t-lg bg-tone-surface p-4 text-tone-white sm:gap-5 sm:p-5 lg:flex-row lg:items-end lg:gap-6 lg:p-6"
      :class="heroBgStyle ? 'media-hero' : null"
      :style="heroBgStyle"
    >
      <div
        class="size-48 shrink-0 overflow-hidden rounded-xl bg-tone-shell shadow-2xl sm:size-56 sm:rounded-2xl lg:size-64"
      >
        <UiCoverImage :src="album?.coverSrc" :alt="album?.name" />
      </div>

      <div class="flex w-full min-w-0 flex-1 flex-col gap-3">
        <!-- Название: максимум, уменьшается только если не влезает в строку -->
        <h1
          ref="titleRef"
          class="w-full min-w-0 text-center font-extrabold leading-none lg:text-left"
          :style="titleFitStyle"
        >
          {{ album?.name }}
        </h1>

        <!-- Mobile: ник артиста отдельно под названием -->
        <NuxtLink
          :to="artistTo"
          class="mx-auto inline-flex max-w-full items-center gap-1.5 text-sm font-bold text-tone-white hover:text-tone-muted lg:hidden"
        >
          <div
            class="size-6 shrink-0 overflow-hidden rounded-full bg-tone-shell"
          >
            <UiCoverImage
              :src="album?.artist.avatarSrc"
              :icon="PhUser"
              :alt="album?.artist.name ?? 'Исполнитель'"
            />
          </div>
          <span class="truncate">{{ album?.artist.name ?? "…" }}</span>
        </NuxtLink>

        <!-- Мета: на desktop — с артистом; на mobile — без (ник выше) -->
        <div
          class="flex min-w-0 justify-center overflow-x-hidden lg:justify-start"
        >
          <div
            class="inline-flex max-w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-tone-white lg:w-max lg:flex-nowrap lg:justify-start lg:whitespace-nowrap"
          >
            <NuxtLink
              :to="artistTo"
              class="hidden shrink-0 items-center gap-1.5 font-bold hover:text-tone-muted lg:inline-flex"
            >
              <div
                class="size-6 shrink-0 overflow-hidden rounded-full bg-tone-shell"
              >
                <UiCoverImage
                  :src="album?.artist.avatarSrc"
                  :icon="PhUser"
                  :alt="album?.artist.name ?? 'Исполнитель'"
                />
              </div>
              <span>{{ album?.artist.name }}</span>
            </NuxtLink>
            <span class="hidden lg:inline" aria-hidden="true">·</span>
            <span>{{ releaseYear }}</span>
            <template v-if="listenersLabel">
              <span aria-hidden="true">·</span>
              <span>{{ listenersLabel }}</span>
            </template>
            <span aria-hidden="true">·</span>
            <span>{{ trackCountLabel }}</span>
            <span aria-hidden="true">·</span>
            <span>{{ totalDurationLabel }}</span>
          </div>
        </div>

        <!-- Действия: mobile — Слушать + like + more по центру; desktop — + сортировка -->
        <div
          class="flex w-full items-center justify-center gap-4 lg:justify-start lg:gap-6"
        >
          <button
            type="button"
            class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-tone-white px-5 text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100 lg:size-14 lg:px-0"
            :aria-label="isPlayingAlbum ? 'Пауза' : 'Слушать альбом'"
            @click="onListenClick"
          >
            <PhPause v-if="isPlayingAlbum" :size="28" weight="fill" />
            <PhPlay v-else :size="28" weight="fill" />
            <span class="text-sm font-medium leading-none lg:hidden">
              {{ isPlayingAlbum ? "Пауза" : "Слушать" }}
            </span>
          </button>

          <div class="flex items-center gap-4">
            <button
              type="button"
              class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted lg:size-12"
              :aria-label="
                isLiked
                  ? `Убрать из любимых, ${likesCountButtonLabel}`
                  : `В любимое, ${likesCountButtonLabel}`
              "
              :aria-pressed="isLiked"
              @click="toggleLike"
            >
              <PhHeart :size="32" :weight="isLiked ? 'fill' : 'light'" />
            </button>

            <AlbumMoreMenu
              v-model:open="moreOpen"
              :is-liked="isLiked"
              :is-playing="isPlayingAlbum"
              @play="onListenClick"
              @toggle-like="toggleLike"
              @go-album="() => navigateTo(albumTo)"
              @go-artist="() => navigateTo(artistTo)"
              @share="openShare"
              @report="openReport"
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
            </AlbumMoreMenu>
          </div>

          <div class="ml-auto hidden min-w-0 lg:block">
            <MenuResponsive v-model:open="sortOpen" :items="sortItems">
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
                    v-if="canToggleSortDir && albumSortDir === 'desc'"
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
        :class="[
          showCompactHeader ? 'opacity-100' : 'pointer-events-none opacity-0',
          compactHeaderStyle ? 'media-hero' : null,
        ]"
        :style="compactHeaderStyle"
        :aria-hidden="!showCompactHeader"
      >
        <!-- Play только на desktop -->
        <button
          type="button"
          class="hidden size-8 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-opacity duration-200 hover:opacity-90 lg:flex"
          :aria-label="isPlayingAlbum ? 'Пауза' : 'Слушать альбом'"
          @click="onListenClick"
        >
          <PhPause v-if="isPlayingAlbum" :size="16" weight="fill" />
          <PhPlay v-else :size="16" weight="fill" />
        </button>

        <p class="min-w-0 flex-1 truncate text-base font-bold text-tone-white">
          {{ album?.name }}
        </p>

        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
          aria-label="Наверх"
          @click="scrollToTop"
        >
          <PhCaretUp :size="24" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Треки и полки -->
    <section class="flex flex-col gap-16 p-6">
      <TracksColumnSection
        variant="index"
        :items="sortedTracks"
        :limit="sortedTracks?.length ?? 0"
        :queue-source="
          album?.id ? { type: 'album', id: album.id, title: album.name } : null
        "
      />

      <AlbumsSwiperSection
        v-if="showArtistAlbums"
        :title="`Альбомы «${album?.artist.name ?? '…'}»`"
        :items="artistAlbums"
        :limit="8"
        :more-to="artistId ? `/user/${artistId}/albums` : undefined"
        more-label="Показать все"
        :show-artist="false"
      />
    </section>
  </div>
</template>
