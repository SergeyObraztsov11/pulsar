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

/** Атмосфера шапки: пока серый (позже — coverColor) */
const headerWashStyle = {
  backgroundImage: `radial-gradient(ellipse 120% 100% at 50% 0%, var(--color-primary-gray) 0%, transparent 75%)`,
};

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
    <!-- Wash: серый (позже coverColor), blur сглаживает полосы -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 z-0 h-140 w-screen -translate-x-1/2 overflow-hidden lg:h-96"
      aria-hidden="true"
    >
      <div
        class="absolute -inset-16 opacity-55 blur-3xl motion-reduce:blur-none motion-reduce:opacity-40"
        :style="headerWashStyle"
      />
    </div>

    <!-- Шапка альбома -->
    <section
      class="relative z-10 flex flex-col items-center gap-3 animate-fade-up motion-reduce:animate-none sm:gap-4 lg:h-64 lg:flex-row lg:items-stretch lg:gap-6"
    >
      <div
        class="size-36 shrink-0 overflow-hidden rounded-xl bg-primary-gray-dark sm:size-52 lg:size-64"
      >
        <UiCoverImage :src="album?.coverSrc" :alt="album?.name" />
      </div>

      <div
        class="flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-center sm:max-w-md lg:h-full lg:max-w-none lg:flex-1 lg:items-stretch lg:justify-between lg:gap-0 lg:text-left"
      >
        <!-- Сверху: тип -->
        <div class="text-sm text-primary-gray hidden lg:block">Альбом</div>

        <!-- По центру: название и артист -->
        <div
          class="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 lg:items-start lg:gap-3"
        >
          <h1
            class="max-w-full text-2xl font-bold wrap-break-word text-primary-white sm:text-4xl lg:truncate lg:text-5xl lg:break-normal"
          >
            {{ album?.name }}
          </h1>
          <NuxtLink
            :to="artistTo"
            class="flex max-w-full flex-row items-center gap-2"
          >
            <div
              class="size-7 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark sm:size-8"
            >
              <UiCoverImage
                :src="album?.artist.avatarSrc"
                :icon="PhUser"
                :alt="album?.artist.name"
              />
            </div>
            <span
              class="truncate text-sm font-semibold text-primary-white hover:underline sm:text-base"
            >
              {{ album?.artist.name }}
            </span>
          </NuxtLink>
        </div>

        <!-- Снизу: мета и кнопки -->
        <div class="flex flex-col items-center gap-2 lg:items-start lg:gap-3">
          <div class="text-sm text-primary-gray">
            {{ metaLabel }}
          </div>
          <div
            class="flex flex-row items-center justify-center gap-2 sm:gap-3 lg:justify-start"
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
