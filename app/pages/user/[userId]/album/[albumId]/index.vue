<script setup lang="ts">
/**
 * Альбом — три блока: шапка, плашка владельца, основной контент (треки / полки).
 * Данные: GET /api/albums/:id; ниже — другие альбомы этого артиста.
 */
import { PhUser } from "@phosphor-icons/vue";
import type { Album, AlbumDetail } from "~/types/album";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import { isSameQueueSource } from "~/stores/player";
import { formatDurationRu } from "~/utils/formatDuration";
import { formatCompactCount } from "~/utils/formatCompactCount";
import { formatListenersLabel } from "~/utils/formatListenersLabel";
import { formatCountRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "app-layout",
  key: (route) => `album-${route.params.userId}-${route.params.albumId}`,
});

const route = useRoute();
const albumId = computed(() => String(route.params.albumId ?? ""));
const { user } = useUserSession();

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

/** Альбом текущего пользователя — плашка владельца */
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
  playerStore.play(first, detail.tracks, {
    type: "album",
    id: detail.id,
    title: detail.name,
  });
}
</script>

<template>
  <div class="relative flex flex-col">
    <!-- Wash: серый (позже coverColor), blur сглаживает полосы -->
    <div
      class="pointer-events-none absolute -top-24 left-1/2 z-0 h-140 w-screen -translate-x-1/2 overflow-hidden lg:h-96"
      aria-hidden="true"
    >
      <div
        class="absolute -inset-16 opacity-70 blur-3xl motion-reduce:blur-none motion-reduce:opacity-45"
        :style="headerWashStyle"
      />
    </div>

    <!-- 1. Шапка -->
    <header
      class="relative z-10 flex flex-col items-center gap-4 animate-fade-up motion-reduce:animate-none lg:flex-row lg:items-stretch lg:gap-6"
    >
      <div
        class="size-36 shrink-0 overflow-hidden rounded-xl bg-primary-gray-dark sm:size-52 lg:size-64"
      >
        <UiCoverImage :src="album?.coverSrc" :alt="album?.name" />
      </div>

      <div
        class="flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-center sm:max-w-md lg:min-h-64 lg:max-w-none lg:flex-1 lg:items-start lg:text-left"
      >
        <div
          class="flex w-full min-w-0 flex-col items-center lg:flex-1 lg:items-start lg:justify-center"
        >
          <div
            class="flex max-w-full flex-row items-center justify-center gap-2 lg:justify-start"
          >
            <h1
              class="min-w-0 text-5xl font-bold leading-none wrap-break-word text-primary-white lg:truncate lg:break-normal"
            >
              {{ album?.name }}
            </h1>
            <UiExplicitIcon :size="30" weight="bold" />
          </div>
        </div>

        <!-- Mobile: артист отдельной строкой между названием и метой -->
        <NuxtLink
          :to="artistTo"
          class="inline-flex min-w-0 max-w-full flex-row items-center gap-2 text-sm text-primary-gray hover:text-primary-white lg:hidden"
        >
          <div
            v-if="album?.artist.avatarSrc"
            class="size-7 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
          >
            <UiCoverImage
              :src="album?.artist.avatarSrc"
              :icon="PhUser"
              :alt="album?.artist.name"
              :icon-size="55"
            />
          </div>
          <span class="truncate">
            {{ album?.artist.name }}
          </span>
        </NuxtLink>

        <div
          class="flex max-w-full flex-row flex-wrap items-center justify-center gap-x-1.5 text-sm text-primary-gray lg:justify-start"
        >
          <!-- Desktop: артист в строке меты -->
          <NuxtLink
            :to="artistTo"
            class="hidden min-w-0 max-w-full flex-row items-center gap-1.5 lg:inline-flex"
          >
            <div
              v-if="album?.artist.avatarSrc"
              class="size-6 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark"
            >
              <UiCoverImage
                :src="album?.artist.avatarSrc"
                :icon="PhUser"
                :alt="album?.artist.name"
                :icon-size="55"
              />
            </div>
            <span class="truncate font-bold text-primary-gray hover:text-primary-white">
              {{ album?.artist.name }}
            </span>
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

        <div
          class="flex flex-row items-center justify-center gap-2 sm:gap-3 lg:justify-start"
        >
          <UiButton
            :icon="isPlayingAlbum ? 'Pause' : 'Play'"
            filled
            variant="white"
            :text="isPlayingAlbum ? 'Пауза' : 'Слушать'"
            @click="onListenClick"
          />
          <UiButton
            variant="gray"
            icon="Heart"
            :filled="isLiked"
            :text="likesCountButtonLabel"
            @click="toggleLike"
          />
          <UiButton variant="gray" icon="DotsThree" />
        </div>
      </div>
    </header>

    <!-- 2. Плашка владельца -->
    <!-- <aside
      v-if="isOwnAlbum"
      class="relative z-10 mt-6 flex w-full flex-row items-center justify-between gap-3 bg-primary-gray-dark p-2"
      aria-label="Управление альбомом"
    >
      <p
        class="min-w-0 px-2 truncate leading-none text-primary-gray font-medium"
      >
        Вы смотрите свой альбом
      </p>
      <div class="flex shrink-0 flex-row items-center gap-1">
        <UiButton variant="ghost" text="Редактировать" type="button" disabled />
        <UiButton variant="ghost" text="Статистика" type="button" disabled />
      </div>
    </aside> -->

    <!-- 3. Основной контент -->
    <div
      class="relative z-10 flex flex-col gap-10 lg:gap-16"
      :class="isOwnAlbum ? 'mt-6' : 'mt-10 lg:mt-16'"
    >
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
      />
    </div>
  </div>
</template>
