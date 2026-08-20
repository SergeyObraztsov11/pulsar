<script setup lang="ts">
/**
 * Альбом — шапка (обложка, мета, play / like) + нумерованный треклист.
 * Данные: GET /api/albums/:id; ниже — другие альбомы этого артиста.
 */
import { PhUser } from "@phosphor-icons/vue";
import type { Album, AlbumDetail } from "~/types/album";
import { isSameQueueSource } from "~/stores/player";

definePageMeta({
  layout: "app-layout",
});

const route = useRoute();
const albumId = computed(() => String(route.params.albumId ?? ""));

const { data: album, error } = await useFetch<AlbumDetail>(
  () => `/api/albums/${albumId.value}`,
  { key: computed(() => `album:${albumId.value}`) },
);

watch(
  error,
  (err) => {
    if (!err) return;
    throw createError({
      statusCode: err.statusCode ?? 404,
      statusMessage: "Album not found",
      fatal: true,
    });
  },
  { immediate: true },
);

// Лайк пока живёт на странице: свой стейт с начальным значением из API
const isLiked = ref(album.value?.isLiked ?? false);
watch(
  () => album.value?.isLiked,
  (value) => {
    if (value != null) isLiked.value = value;
  },
);

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

const releaseYear = computed(() => {
  const raw = album.value?.releaseDate ?? album.value?.createdAt;
  if (!raw) return null;
  const year = new Date(raw).getFullYear();
  return Number.isNaN(year) ? null : year;
});

/** «1 трек» / «2 трека» / «5 треков» */
const trackCountLabel = computed(() => {
  const count = album.value?.trackCount ?? 0;
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} трек`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} трека`;
  }
  return `${count} треков`;
});

/** Общая длительность: m:ss, с часами — h:mm:ss */
const totalDurationLabel = computed(() => {
  const total = album.value?.totalDurationSec ?? 0;
  if (total <= 0) return null;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, "0");
  if (!hours) return `${minutes}:${ss}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
});

const metaLabel = computed(() =>
  [releaseYear.value, trackCountLabel.value, totalDurationLabel.value]
    .filter(Boolean)
    .join(" · "),
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

/** Атмосфера: цвет сверху, вниз в прозрачный (фон страницы) */
const headerWashStyle = computed(() => {
  const color = album.value?.coverColor;
  if (!color) return undefined;
  return {
    backgroundImage: `linear-gradient(to bottom, ${color} 0%, transparent 72%)`,
  };
});

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
  playerStore.play(first, detail.tracks, { type: "album", id: detail.id });
}
</script>

<template>
  <div class="relative flex flex-col gap-10 lg:gap-16">
    <!-- Wash: под хедер, на всю ширину скролла; хедер прозрачный до скролла -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 z-0 h-140 w-screen -translate-x-1/2 bg-linear-to-t from-transparent to-primary-gray opacity-50 lg:h-96"
      aria-hidden="true"
    />

    <!-- Шапка альбома -->
    <section
      class="relative z-10 flex flex-col items-center gap-6 animate-fade-up motion-reduce:animate-none lg:h-64 lg:flex-row lg:items-stretch"
    >
      <div
        class="size-48 shrink-0 overflow-hidden rounded-xl bg-primary-gray-dark sm:size-56 lg:size-64"
      >
        <UiCoverImage :src="album?.coverSrc" :alt="album?.name" />
      </div>

      <div
        class="flex min-w-0 flex-1 flex-col items-center gap-6 text-center lg:items-stretch lg:justify-between lg:text-left"
      >
        <div class="flex min-w-0 flex-col items-center gap-2 lg:items-start">
          <div class="text-sm text-primary-white">Альбом</div>
          <h1
            class="max-w-full text-3xl font-bold text-primary-white sm:text-4xl lg:truncate lg:text-5xl"
          >
            {{ album?.name }}
          </h1>

          <NuxtLink
            :to="artistTo"
            class="flex max-w-full flex-row items-center gap-3"
          >
            <div
              class="size-10 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
            >
              <UiCoverImage
                :src="album?.artist.avatarSrc"
                :icon="PhUser"
                :alt="album?.artist.name"
              />
            </div>
            <span
              class="truncate text-xl font-semibold text-primary-white hover:underline"
            >
              {{ album?.artist.name }}
            </span>
          </NuxtLink>

          <div class="text-sm text-primary-white">{{ metaLabel }}</div>
        </div>

        <div
          class="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
        >
          <UiButton
            :icon="isPlayingAlbum ? 'Pause' : 'Play'"
            filled
            variant="white"
            text="Слушать"
            @click="onListenClick"
          />
          <UiButton
            variant="gray"
            icon="Heart"
            :filled="isLiked"
            @click="isLiked = !isLiked"
          />
          <UiButton variant="gray" icon="DotsThree" />
        </div>
      </div>
    </section>

    <TracksColumnSection
      variant="index"
      :items="album?.tracks ?? null"
      :limit="album?.tracks.length ?? 0"
      :queue-source="album?.id ? { type: 'album', id: album.id } : null"
    />

    <AlbumsSwiperSection
      v-if="showArtistAlbums"
      title="Ещё у артиста"
      :items="artistAlbums"
      :limit="8"
    />
  </div>
</template>
