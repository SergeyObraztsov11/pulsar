<script setup lang="ts">
/**
 * Артист — шапка в духе YouTube: имя, bio, слушатели, текстовые ссылки, кнопки.
 * Данные: GET /api/artists/:id.
 */
import { PhEmpty, PhLink, PhUser } from "@phosphor-icons/vue";
import ModalArtistMore, {
  type ModalArtistMoreProps,
} from "~/components/modals/ModalArtistMore.vue";
import type { ArtistDetail, ArtistLink, ArtistLinkKind } from "~/types/artist";
import { isSameQueueSource } from "~/stores/player";

definePageMeta({
  layout: "app-layout",
});

const route = useRoute();
const userId = computed(() => String(route.params.userId ?? ""));

const { user } = useUserSession();

/** Свой профиль — другой chrome (редактировать, без лайка) */
const isOwnProfile = computed(
  () => Boolean(user.value?.id) && user.value?.id === userId.value,
);

const { data: artist, error } = await useFetch<ArtistDetail>(
  () => `/api/artists/${userId.value}`,
  { key: computed(() => `artist:${userId.value}`) },
);

watch(
  error,
  (err) => {
    if (!err) return;
    throw createError({
      statusCode: err.statusCode ?? 404,
      statusMessage: "Artist not found",
      fatal: true,
    });
  },
  { immediate: true },
);

// Лайк пока живёт на странице: свой стейт с начальным значением из API
const isLiked = ref(artist.value?.isLiked ?? false);
watch(
  () => artist.value?.isLiked,
  (value) => {
    if (value != null) isLiked.value = value;
  },
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

/** Свой пустой профиль — «Редактировать» на месте «Слушать» */
const showEditAsPrimary = computed(
  () => isOwnProfile.value && showEmptyContent.value,
);

/** Свой профиль с контентом — «Редактировать» справа */
const showEditOnRight = computed(
  () => isOwnProfile.value && !showEmptyContent.value,
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

/** Компактно: «12 тыс.» / «1,2 млн» */
function formatListenersCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    const rounded =
      value >= 10 ? String(Math.round(value)) : value.toFixed(1).replace(".", ",");
    return `${rounded.replace(/,0$/, "")} млн`;
  }
  if (count >= 1_000) {
    return `${Math.round(count / 1_000)} тыс.`;
  }
  return count.toLocaleString("ru-RU");
}

/** Плейсхолдер, если bio не заполнен */
const bioPlaceholder = computed(() =>
  isOwnProfile.value
    ? "Здесь будет ваше описание — расскажите слушателям, кто вы и какую музыку делаете."
    : "Артист пока не добавил описание. Загляните позже — здесь появится пара слов о нём.",
);

const hasBio = computed(() => Boolean(artist.value?.bio?.trim()));

/** Есть ли ненулевые слушатели (для цвета подписи) */
const hasListeners = computed(
  () => (artist.value?.listenersCount ?? 0) > 0,
);

/** «Нет слушателей» / «1 слушатель» / … */
const listenersLabel = computed(() => {
  const count = artist.value?.listenersCount;
  if (count == null) return null;
  if (count <= 0) return "Нет слушателей";
  const formatted = formatListenersCount(count);
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${formatted} слушатель`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${formatted} слушателя`;
  }
  return `${formatted} слушателей`;
});

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
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `и ещё ${count} ссылка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `и ещё ${count} ссылки`;
  }
  return `и ещё ${count} ссылок`;
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
  const detail = artist.value;
  if (!detail) return;
  if (isCurrentArtist.value) {
    playerStore.togglePlaying();
    return;
  }
  const first = detail.tracks.find((track) => Boolean(track.audioSrc));
  if (!first) return;
  playerStore.play(first, detail.tracks, { type: "artist", id: detail.id });
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

    <!-- Шапка: сверху имя, по центру info, снизу кнопки -->
    <section
      class="relative z-10 flex flex-col items-center gap-4 animate-fade-up motion-reduce:animate-none sm:gap-5 lg:h-64 lg:flex-row lg:items-stretch lg:gap-6"
    >
      <div
        class="group relative size-36 shrink-0 overflow-hidden rounded-full bg-primary-gray-dark sm:size-52 lg:size-64"
      >
        <UiCoverImage
          :src="artist?.avatarSrc"
          :icon="PhUser"
          :alt="artist?.name"
        />

        <!-- Свой профиль: hover → редактировать (как play на AlbumCard) -->
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
        class="flex w-full min-w-0 max-w-sm flex-col items-center text-center sm:max-w-md lg:h-full lg:max-w-none lg:flex-1 lg:items-stretch lg:justify-between lg:text-left"
      >
        <!-- Сверху: имя -->
        <h1
          class="mb-5 max-w-full text-2xl font-bold wrap-break-word text-primary-white sm:mb-6 sm:text-4xl lg:truncate lg:text-5xl lg:break-normal"
        >
          {{ artist?.name }}
        </h1>

        <!-- По центру: bio, слушатели, ссылки -->
        <div
          class="flex min-w-0 flex-col items-center gap-1.5 sm:gap-2 lg:items-start"
        >
          <p
            class="line-clamp-3 max-w-prose text-sm sm:text-base"
            :class="hasBio ? 'text-primary-white' : 'text-primary-gray'"
          >
            {{ hasBio ? artist?.bio : bioPlaceholder }}
          </p>

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

        <!-- Снизу: play/more/share; свой пустой — edit primary; свой с контентом — edit справа -->
        <div
          class="mt-5 flex w-full flex-row flex-wrap items-center justify-center gap-2 sm:mt-6 sm:gap-3 lg:justify-between"
        >
          <div class="flex flex-row items-center gap-2 sm:gap-3">
            <UiButton
              v-if="canListen"
              :icon="isPlayingArtist ? 'Pause' : 'Play'"
              filled
              variant="white"
              text="Слушать"
              @click="onListenClick"
            />
            <UiButton
              v-else-if="showEditAsPrimary"
              icon="PencilSimple"
              variant="gray"
              text="Редактировать"
              href="/settings"
              target="_self"
            />
            <UiButton
              v-if="!isOwnProfile"
              variant="gray"
              icon="Heart"
              :filled="isLiked"
              @click="isLiked = !isLiked"
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

          <UiButton
            v-if="showEditOnRight"
            icon="PencilSimple"
            variant="gray"
            text="Редактировать"
            href="/settings"
            target="_self"
          />
        </div>
      </div>
    </section>

    <div
      v-if="showEmptyContent"
      class="flex flex-col items-center justify-center gap-3 py-20 text-center text-primary-gray sm:py-28"
    >
      <PhEmpty :size="48" weight="light" class="shrink-0" />
      <p class="text-xl font-bold sm:text-2xl">
        {{ emptyContentTitle }}
      </p>
      <p class="max-w-sm text-sm sm:text-base">
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
        :queue-source="artist?.id ? { type: 'artist', id: artist.id } : null"
      />

      <AlbumsSwiperSection
        v-if="showAlbums"
        title="Альбомы"
        :items="artist?.albums ?? null"
        :limit="8"
      />
    </template>
  </div>
</template>
