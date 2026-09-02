<script setup lang="ts">
/**
 * Артист — три блока: шапка, плашка владельца, основной контент.
 * Данные: GET /api/artists/:id.
 */
import { PhEmpty, PhLink, PhUser } from "@phosphor-icons/vue";
import ModalArtistMore, {
  type ModalArtistMoreProps,
} from "~/components/modals/ModalArtistMore.vue";
import type { ArtistDetail, ArtistLink, ArtistLinkKind } from "~/types/artist";
import { ApiErrorCode } from "#shared/apiErrorCodes";
import { isSameQueueSource } from "~/stores/player";
import { formatCompactCount } from "~/utils/formatCompactCount";
import { formatListenersLabel } from "~/utils/formatListenersLabel";
import { pluralizeRu } from "~/utils/pluralizeRu";

definePageMeta({
  layout: "app-layout",
  key: (route) => `artist-${route.params.userId}`,
});

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ""));

const { user } = useUserSession();

/** Свой профиль — плашка владельца */
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

/** Плейсхолдер, если bio не заполнен */
const bioPlaceholder = computed(() =>
  isOwnProfile.value
    ? "Здесь будет ваше описание — расскажите слушателям, кто вы и какую музыку делаете."
    : "Артист пока не добавил описание. Загляните позже — здесь появится пара слов о нём.",
);

const hasBio = computed(() => Boolean(artist.value?.bio?.trim()));

/** Есть ли ненулевые слушатели (для цвета подписи) */
const hasListeners = computed(() => (artist.value?.listenersCount ?? 0) > 0);

/** «Нет слушателей» / «1,2 млн слушателей» */
const listenersLabel = computed(() =>
  formatListenersLabel(artist.value?.listenersCount),
);

const LINK_LABELS: Record<ArtistLinkKind, string> = {
  spotify: "Spotify",
  appleMusic: "Apple Music",
  yandexMusic: "Яндекс Музыка",
  instagram: "Instagram",
  telegram: "Telegram",
  youtube: "YouTube",
  tiktok: "TikTok",
  vk: "VK",
};

const artistLinks = computed(() => artist.value?.links ?? []);

const primaryLink = computed(() => artistLinks.value[0] ?? null);

const moreLinksCount = computed(() =>
  Math.max(0, artistLinks.value.length - 1),
);

/** Подпись «и ещё N ссылки» */
const moreLinksLabel = computed(() => {
  const count = moreLinksCount.value;
  if (count <= 0) return null;
  return pluralizeRu(
    count,
    `и ещё ${count} ссылка`,
    `и ещё ${count} ссылки`,
    `и ещё ${count} ссылок`,
  );
});

const linksExpanded = ref(false);

function linkLabel(link: ArtistLink): string {
  return LINK_LABELS[link.kind] ?? link.href;
}

/** Атмосфера шапки: пока серый (позже — coverColor) */
const headerWashStyle = {
  backgroundImage: `radial-gradient(ellipse 120% 100% at 50% 0%, var(--color-primary-gray) 0%, transparent 75%)`,
};

const { open: openModal } = useModal();

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
function onMoreClick() {
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
  <div class="relative flex flex-col">
    <!-- Wash: серый (позже coverColor), blur сглаживает полосы -->
    <div
      class="pointer-events-none absolute -top-24 inset-x-0 z-0 h-140 overflow-hidden lg:h-96"
      aria-hidden="true"
    >
      <div
        class="absolute -inset-16 opacity-55 blur-3xl motion-reduce:blur-none motion-reduce:opacity-40"
        :style="headerWashStyle"
      />
    </div>

    <!-- 1. Шапка -->
    <header
      class="relative z-10 flex flex-col items-center gap-4 animate-fade-up motion-reduce:animate-none lg:flex-row lg:items-stretch lg:gap-6"
    >
      <div
        class="group relative size-36 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark sm:size-52 lg:size-64"
      >
        <UiCoverImage
          :src="artist?.avatarSrc"
          :icon="PhUser"
          :alt="artist?.name"
        />

        <!-- Свой профиль: hover → редактировать аватар -->
        <template v-if="isOwnProfile">
          <div
            class="pointer-events-none absolute inset-0 bg-primary-black/50 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 motion-reduce:transition-none"
          />
          <div
            class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100 motion-reduce:transition-none"
          >
            <UiButton
              class="pointer-events-auto scale-150"
              variant="gray"
              icon="Camera"
              aria-label="Редактировать"
              href="/settings"
              target="_self"
            />
          </div>
        </template>
      </div>

      <div
        class="flex w-full min-w-0 max-w-sm flex-col items-center gap-3 text-center sm:max-w-md lg:min-h-64 lg:max-w-none lg:flex-1 lg:items-start lg:gap-3 lg:text-left"
      >
        <div
          class="flex w-full min-w-0 flex-col items-center gap-2 lg:flex-1 lg:items-start lg:justify-center lg:gap-3"
        >
          <h1
            class="max-w-full py-1 text-5xl font-bold leading-none wrap-break-word text-primary-white lg:truncate lg:break-normal"
          >
            {{ artist?.name }}
          </h1>
          <p
            class="line-clamp-3 max-w-prose"
            :class="
              hasBio
                ? 'text-base text-primary-white'
                : 'text-sm text-primary-gray'
            "
          >
            {{ hasBio ? artist?.bio : bioPlaceholder }}
          </p>
        </div>

        <div
          class="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 lg:items-start"
        >
          <p
            v-if="listenersLabel"
            class="text-sm"
            :class="hasListeners ? 'text-primary-white' : 'text-primary-gray'"
          >
            {{ listenersLabel }}
          </p>

          <div
            v-if="primaryLink"
            class="flex max-w-full flex-row flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm lg:justify-start"
          >
            <PhLink
              :size="16"
              weight="light"
              class="shrink-0 text-primary-white"
            />

            <template v-if="!linksExpanded">
              <a
                :href="primaryLink.href"
                target="_blank"
                rel="noopener noreferrer"
                class="truncate text-primary-white hover:underline"
              >
                {{ linkLabel(primaryLink) }}
              </a>
              <button
                v-if="moreLinksLabel"
                type="button"
                class="shrink-0 text-primary-white underline decoration-primary-white/40 underline-offset-2 hover:decoration-primary-white"
                @click="linksExpanded = true"
              >
                {{ moreLinksLabel }}
              </button>
            </template>

            <template v-else>
              <template v-for="(link, index) in artistLinks" :key="link.kind">
                <span
                  v-if="index > 0"
                  class="text-primary-white"
                  aria-hidden="true"
                  >·</span
                >
                <a
                  :href="link.href"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="truncate text-primary-white hover:underline"
                >
                  {{ linkLabel(link) }}
                </a>
              </template>
            </template>
          </div>
        </div>

        <!-- Кнопки всегда на месте; на своём профиле лайк / пустой listen — disabled -->
        <div
          class="flex w-full flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start"
        >
          <UiButton
            :icon="isPlayingArtist ? 'Pause' : 'Play'"
            filled
            variant="white"
            :text="isPlayingArtist ? 'Пауза' : 'Слушать'"
            :disabled="!canListen"
            @click="onListenClick"
          />
          <UiButton
            variant="gray"
            icon="Heart"
            :filled="isLiked"
            :text="likesCountButtonLabel"
            @click="toggleLike"
          />
          <UiButton
            variant="gray"
            icon="DotsThree"
            aria-label="Ещё"
            @click="onMoreClick"
          />
          <UiButton
            variant="gray"
            icon="ShareNetwork"
            aria-label="Поделиться"
            @click="onShareClick"
          />
        </div>
      </div>
    </header>

    <!-- 2. Плашка владельца -->
    <!-- <aside
      v-if="isOwnProfile"
      class="relative z-10 mt-6 flex w-full flex-row items-center justify-between gap-3 bg-primary-gray-dark p-2"
      aria-label="Управление профилем"
    >
      <p
        class="min-w-0 truncate px-2  leading-none text-primary-gray"
      >
        Вы смотрите свой профиль
      </p>
      <div class="flex shrink-0 flex-row items-center gap-1">
        <UiButton
          variant="ghost"
          text="Редактировать"
          type="button"
          href="/settings"
          target="_self"
        />
        <UiButton variant="ghost" text="Статистика" type="button" disabled />
      </div>
    </aside> -->

    <!-- 3. Основной контент -->
    <main
      class="relative z-10 flex flex-col gap-10 lg:gap-16"
      :class="isOwnProfile ? 'mt-6' : 'mt-10 lg:mt-16'"
    >
      <div
        v-if="showEmptyContent"
        class="flex flex-col items-center justify-center gap-3 py-20 text-center text-primary-gray sm:py-28"
      >
        <PhEmpty :size="48" weight="light" class="shrink-0" />
        <p class="text-2xl font-bold text-primary-white">
          {{ emptyContentTitle }}
        </p>
        <p class="max-w-sm text-sm text-primary-gray">
          {{ emptyContentDescription }}
        </p>
      </div>

      <template v-else>
        <TracksSwiperSection
          v-if="showTracks"
          title="Треки"
          variant="cover"
          :items="artist?.tracks ?? null"
          :limit="artist?.tracks.length ?? 20"
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
        />
      </template>
    </main>
  </div>
</template>
