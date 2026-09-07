<script setup lang="ts">
/**
 * Артист — шапка, популярные треки, полка альбомов.
 * Данные: GET /api/artists/:id.
 */
import {
  PhEmpty,
  PhUser,
  PhPlay,
  PhPause,
  PhDotsThree,
  PhHeart,
  PhCaretUp,
} from "@phosphor-icons/vue";
import ModalArtistMore, {
  type ModalArtistMoreProps,
} from "~/components/modals/ModalArtistMore.vue";
import type { ArtistDetail } from "~/types/artist";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import { isSameQueueSource } from "~/stores/player";
import { formatCompactCount } from "~/utils/formatCompactCount";

definePageMeta({
  layout: "app-layout",
  pageTransition: false,
  key: (route) => `artist-${route.params.userId}`,
});

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ""));

const { user } = useUserSession();

/** Свой профиль — hover-камера на аватаре */
const isOwnProfile = computed(
  () => Boolean(user.value?.id) && user.value?.id === userId.value,
);

const { data: artist, error } = await useFetch<ArtistDetail>(
  () => `/api/artists/${userId.value}`,
  { key: computed(() => `artist:${userId.value}`) },
);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? ApiErrorCode.ARTIST_NOT_FOUND,
    fatal: true,
  });
}

const artistIdForLike = computed(() => artist.value?.id);
const { isLiked, toggleLike } = useLike("artist", artistIdForLike, {
  initial: computed(() => artist.value?.isLiked),
});

/** Число лайков; ±1 при toggle на странице */
const likesCount = computed(() => {
  let count = artist.value?.likesCount ?? 0;
  const serverLiked = artist.value?.isLiked ?? false;
  if (isLiked.value !== serverLiked) {
    count += isLiked.value ? 1 : -1;
  }
  return Math.max(0, count);
});

const likesCountButtonLabel = computed(() =>
  formatCompactCount(likesCount.value),
);

const showAlbums = computed(
  () => artist.value == null || (artist.value.albums?.length ?? 0) > 0,
);

const showTracks = computed(
  () => artist.value == null || (artist.value.tracks?.length ?? 0) > 0,
);

/** Загрузили профиль, контента нет — плейсхолдер по центру */
const showEmptyContent = computed(() => {
  if (artist.value == null) return false;
  return (
    (artist.value.tracks?.length ?? 0) === 0 &&
    (artist.value.albums?.length ?? 0) === 0
  );
});

const emptyContentTitle = computed(() =>
  isOwnProfile.value ? "Здесь будет ваш контент" : "Пока нет контента",
);

const emptyContentDescription = computed(() =>
  isOwnProfile.value
    ? "Треки и альбомы появятся после загрузки."
    : "У артиста ещё нет треков и альбомов.",
);

/** Есть что поставить в очередь */
const canListen = computed(() =>
  Boolean(artist.value?.tracks?.some((track) => Boolean(track.audioSrc))),
);

const playerStore = usePlayerStore();

const isCurrentArtist = computed(() => {
  const id = artist.value?.id;
  if (!id) return false;
  return isSameQueueSource(playerStore.queueSource, { type: "artist", id });
});

const isPlayingArtist = computed(
  () => isCurrentArtist.value && playerStore.isPlaying,
);

const hasBio = computed(() => Boolean(artist.value?.bio?.trim()));

/** Accent из аватара для hero; fallback — coverColor первого альбома */
const heroColor = computed(() => {
  const fromAvatar = artist.value?.avatarColor?.trim();
  if (fromAvatar && /^#[0-9a-fA-F]{6}$/.test(fromAvatar)) return fromAvatar;
  const fromAlbum = artist.value?.albums?.[0]?.coverColor?.trim();
  if (fromAlbum && /^#[0-9a-fA-F]{6}$/.test(fromAlbum)) return fromAlbum;
  return null;
});

/** Фон hero: avatarColor / coverColor + мягкая тень к tone-canvas */
const heroBgStyle = computed(() => {
  const color = heroColor.value;
  if (!color) return undefined;
  return {
    backgroundImage: `linear-gradient(to bottom, ${color} 0%, ${color} 55%, color-mix(in srgb, ${color} 70%, var(--color-tone-canvas)) 100%)`,
  };
});

/** Компактный хедер — нижний тон градиента */
const compactHeaderStyle = computed(() => {
  const color = heroColor.value;
  if (!color) return undefined;
  return {
    backgroundColor: `color-mix(in srgb, ${color} 70%, var(--color-tone-canvas))`,
  };
});

const moreOpen = ref(false);

const { open: openModal } = useModal();

const heroRef = ref<HTMLElement | null>(null);
const titleRef = ref<HTMLElement | null>(null);

/** Макс. размер названия: mobile text-5xl, desktop text-8xl */
const lgUp = useLgUp();
const titleMaxPx = computed(() => (lgUp.value ? 96 : 48));

const { style: titleFitStyle } = useFitText(titleRef, {
  maxPx: titleMaxPx,
  minPx: 24,
  watchSources: [() => artist.value?.name],
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

/** Листать main вверх к шапке артиста */
function scrollToTop() {
  const scrollRoot = heroRef.value?.closest("main");
  scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
}

/** Треки уже на странице — без второго запроса */
function onListenClick() {
  if (!canListen.value) return;
  const detail = artist.value;
  if (!detail) return;
  if (isCurrentArtist.value) {
    playerStore.togglePlaying();
    return;
  }
  const first = detail.tracks.find((track) => Boolean(track.audioSrc));
  if (!first) return;
  playerStore.play(first, detail.tracks, {
    type: "artist",
    id: detail.id,
    title: detail.name,
  });
}

/** Модалка «О артисте» */
function onAboutClick() {
  const detail = artist.value;
  if (!detail) return;
  openModal<ModalArtistMoreProps>({
    component: ModalArtistMore,
    props: {
      artistId: detail.id,
      artistName: detail.name,
      bio: detail.bio,
      country: detail.country,
      listenersCount: detail.listenersCount,
      albumCount: detail.albumCount,
      trackCount: detail.trackCount,
      links: detail.links,
      isOwnProfile: isOwnProfile.value,
    },
  });
}

/** Поделиться ссылкой на артиста */
async function onShareClick() {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const title = artist.value?.name ?? "Артист";
  if (!url) return;
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      // отмена шаринга — ничего не делаем
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
    <!-- Шапка артиста: mobile — колонка, desktop — ряд -->
    <header
      ref="heroRef"
      class="relative flex shrink-0 flex-col items-center gap-4 overflow-hidden rounded-t-lg bg-tone-surface p-4 text-tone-white sm:gap-5 sm:p-5 lg:flex-row lg:items-end lg:gap-6 lg:p-6"
      :style="heroBgStyle"
    >
      <div
        class="group relative size-48 shrink-0 overflow-hidden rounded-full bg-tone-shell shadow-2xl sm:size-56 lg:size-64"
      >
        <UiCoverImage
          :src="artist?.avatarSrc"
          :icon="PhUser"
          :alt="artist?.name"
        />

        <!-- Свой профиль: hover → редактировать аватар -->
      </div>

      <div class="flex w-full min-w-0 flex-1 flex-col gap-3">
        <!-- Название: максимум, уменьшается только если не влезает в строку -->
        <h1
          ref="titleRef"
          class="w-full min-w-0 text-center font-extrabold leading-none lg:text-left"
          :style="titleFitStyle"
        >
          {{ artist?.name }}
        </h1>

        <!-- Описание; у себя без bio — приглашение добавить -->
        <p
          v-if="hasBio"
          class="mx-auto line-clamp-2 max-w-prose text-center text-base text-tone-white lg:mx-0 lg:text-left"
        >
          {{ artist?.bio }}
        </p>
        <NuxtLink
          v-else-if="isOwnProfile"
          to="/settings"
          class="mx-auto max-w-prose text-center text-sm text-tone-white underline transition-colors hover:text-tone-muted lg:mx-0 lg:text-left"
        >
          Добавить описание
        </NuxtLink>

        <!-- Действия: mobile — Слушать + like + more по центру -->
        <div
          class="flex w-full items-center justify-center gap-4 lg:justify-start lg:gap-6"
        >
          <button
            type="button"
            class="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-tone-white px-5 text-tone-canvas transition-[transform,opacity] duration-200 hover:scale-105 hover:opacity-90 active:scale-95 motion-reduce:transform-none motion-reduce:hover:scale-100 disabled:pointer-events-none disabled:opacity-40 lg:size-14 lg:px-0"
            :aria-label="isPlayingArtist ? 'Пауза' : 'Слушать'"
            :disabled="!canListen"
            @click="onListenClick"
          >
            <PhPause v-if="isPlayingArtist" :size="28" weight="fill" />
            <PhPlay v-else :size="28" weight="fill" />
            <span class="text-sm font-medium leading-none lg:hidden">
              {{ isPlayingArtist ? "Пауза" : "Слушать" }}
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

            <ArtistMoreMenu
              v-model:open="moreOpen"
              :is-liked="isLiked"
              :is-playing="isPlayingArtist"
              @play="onListenClick"
              @toggle-like="toggleLike"
              @about="onAboutClick"
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
            </ArtistMoreMenu>
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
          :aria-label="isPlayingArtist ? 'Пауза' : 'Слушать'"
          :disabled="!canListen"
          @click="onListenClick"
        >
          <PhPause v-if="isPlayingArtist" :size="16" weight="fill" />
          <PhPlay v-else :size="16" weight="fill" />
        </button>

        <p class="min-w-0 flex-1 truncate text-base font-bold text-tone-white">
          {{ artist?.name }}
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
      <div
        v-if="showEmptyContent"
        class="flex flex-col items-center justify-center gap-3 py-20 text-center text-tone-muted sm:py-28"
      >
        <PhEmpty :size="48" weight="light" class="shrink-0" />
        <p class="text-2xl font-bold text-tone-white">
          {{ emptyContentTitle }}
        </p>
        <p class="max-w-sm text-sm text-tone-white">
          {{ emptyContentDescription }}
        </p>
      </div>

      <template v-else>
        <TracksColumnSection
          v-if="showTracks"
          title="Популярное"
          variant="cover"
          :items="artist?.tracks ?? null"
          :limit="5"
          :more-to="artist?.id ? `/user/${artist.id}/tracks` : undefined"
          more-label="Показать все"
          :queue-source="
            artist?.id
              ? { type: 'artist', id: artist.id, title: artist.name }
              : null
          "
        />

        <AlbumsSwiperSection
          v-if="showAlbums"
          title="Альбомы"
          :items="artist?.albums ?? null"
          :limit="8"
          :more-to="artist?.id ? `/user/${artist.id}/albums` : undefined"
          more-label="Показать все"
          :show-artist="false"
        />
      </template>
    </section>
  </div>
</template>
