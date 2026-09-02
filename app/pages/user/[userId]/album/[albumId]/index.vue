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
  PhPlusSquare,
} from "@phosphor-icons/vue";
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

const albumIdForLike = computed(() => album.value?.id);
const { isLiked, toggleLike } = useLike("album", albumIdForLike, {
  initial: computed(() => album.value?.isLiked),
});

const moreOpen = ref(false);
const compactMoreOpen = ref(false);

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
</script>

<template>
  <div>
    <!-- Шапка альбома -->
    <header
      ref="heroRef"
      class="relative flex shrink-0 items-end gap-6 overflow-hidden rounded-t-lg bg-tone-surface p-6 text-tone-white"
      :style="heroBgStyle"
    >
      <div
        class="size-64 shrink-0 overflow-hidden rounded-2xl bg-tone-shell shadow-2xl"
      >
        <UiCoverImage :src="album?.coverSrc" :alt="album?.name" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-3">
        <!-- Имя альбома, explicit -->

        <h1 class="min-w-0 truncate text-8xl font-extrabold leading-none">
          {{ album?.name }}
        </h1>

        <!-- Артист, год выпуска, слушатели, треки, длительность -->
        <p class="flex flex-row items-center gap-x-1.5 text-sm text-tone-white">
          <NuxtLink
            :to="artistTo"
            class="inline-flex max-w-full items-center gap-1.5 font-bold hover:text-tone-muted"
          >
            <div
              v-if="album?.artist.avatarSrc"
              class="size-6 shrink-0 overflow-hidden rounded-full"
            >
              <UiCoverImage
                :src="album?.artist.avatarSrc"
                :icon="PhUser"
                :alt="album?.artist.name"
                :icon-size="55"
              />
            </div>
            <span class="truncate">{{ album?.artist.name }}</span>
          </NuxtLink>
          <span aria-hidden="true">·</span>
          <span>{{ releaseYear }}</span>
          <template v-if="listenersLabel">
            <span aria-hidden="true">·</span>
            <span>{{ listenersLabel }}</span>
          </template>
          <span aria-hidden="true">·</span>
          <span>{{ trackCountLabel }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ totalDurationLabel }}</span>
        </p>
        <!-- Действия: play, лайк, ещё -->
        <div class="flex items-center gap-6">
          <button
            type="button"
            class="flex size-14 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100"
            :aria-label="isPlayingAlbum ? 'Пауза' : 'Слушать альбом'"
            @click="onListenClick"
          >
            <PhPause v-if="isPlayingAlbum" :size="28" weight="fill" />
            <PhPlay v-else :size="28" weight="fill" />
          </button>

          <div class="flex items-center gap-4">
            <button
              type="button"
              class="flex size-12 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
              :aria-label="
                isLiked
                  ? `Убрать из любимых, ${likesCountButtonLabel}`
                  : `В любимое, ${likesCountButtonLabel}`
              "
              :aria-pressed="isLiked"
              @click="toggleLike"
            >
              <PhPlusSquare :size="32" :weight="isLiked ? 'fill' : 'regular'" />
            </button>

            <AlbumMoreMenu
              v-model:open="moreOpen"
              :is-liked="isLiked"
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
                  class="flex size-12 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
                  aria-label="Ещё"
                >
                  <PhDotsThree :size="32" weight="bold" />
                </button>
              </template>
            </AlbumMoreMenu>
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
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-tone-white text-tone-canvas transition-opacity duration-200 hover:opacity-90"
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
          :aria-label="
            isLiked
              ? `Убрать из любимых, ${likesCountButtonLabel}`
              : `В любимое, ${likesCountButtonLabel}`
          "
          :aria-pressed="isLiked"
          @click="toggleLike"
        >
          <PhPlusSquare :size="24" :weight="isLiked ? 'fill' : 'regular'" />
        </button>

        <AlbumMoreMenu
          v-model:open="compactMoreOpen"
          :is-liked="isLiked"
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
              class="flex size-10 shrink-0 items-center justify-center text-tone-white transition-colors duration-200 hover:text-tone-muted"
              aria-label="Ещё"
            >
              <PhDotsThree :size="24" weight="bold" />
            </button>
          </template>
        </AlbumMoreMenu>
      </div>
    </div>

    <!-- Треки и полки -->
    <section class="flex flex-col gap-16 p-6">
      <TracksColumnSection
        variant="index"
        :items="album?.tracks ?? null"
        :limit="album?.tracks.length ?? 0"
        :queue-source="
          album?.id ? { type: 'album', id: album.id, title: album.name } : null
        "
      />

      <AlbumsSwiperSection
        v-if="showArtistAlbums"
        title="Ещё у артиста"
        :items="artistAlbums"
        :limit="8"
        :show-artist="false"
      />
    </section>
  </div>
</template>
