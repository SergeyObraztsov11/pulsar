<script lang="ts">
/**
 * Модалка «О артисте» — в духе YouTube About, на токенах Pulsar.
 */
import type { ArtistLink } from "~/types/artist";

export type ModalArtistMoreProps = {
  artistId: string;
  artistName: string;
  bio?: string | null;
  country?: string | null;
  listenersCount?: number;
  albumCount?: number;
  trackCount?: number;
  links?: ArtistLink[];
  /** Свой профиль — другой плейсхолдер для пустого bio */
  isOwnProfile?: boolean;
};
</script>

<script setup lang="ts">
import {
  PhAppleLogo,
  PhDisc,
  PhGlobe,
  PhHeadphones,
  PhInstagramLogo,
  PhLink,
  PhMusicNotes,
  PhSpotifyLogo,
  PhTelegramLogo,
  PhTiktokLogo,
  PhUser,
  PhYoutubeLogo,
} from "@phosphor-icons/vue";
import type { Component } from "vue";
import type { ArtistLinkKind } from "~/types/artist";

const props = withDefaults(defineProps<ModalArtistMoreProps>(), {
  bio: null,
  country: null,
  listenersCount: 0,
  albumCount: 0,
  trackCount: 0,
  links: () => [],
  isOwnProfile: false,
});

const { close } = useModal();

function onClose() {
  close();
}

const bioDisplay = computed(() => {
  const bio = props.bio?.trim();
  if (bio) return bio;
  return props.isOwnProfile
    ? "Здесь будет ваше описание — расскажите слушателям, кто вы и какую музыку делаете."
    : "Артист пока не добавил описание. Загляните позже — здесь появится пара слов о нём.";
});

const hasBio = computed(() => Boolean(props.bio?.trim()));

const LINK_ICONS: Partial<Record<ArtistLinkKind, Component>> = {
  spotify: PhSpotifyLogo,
  appleMusic: PhAppleLogo,
  yandexMusic: PhMusicNotes,
  instagram: PhInstagramLogo,
  telegram: PhTelegramLogo,
  youtube: PhYoutubeLogo,
  tiktok: PhTiktokLogo,
};

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

function linkHost(href: string): string {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/** Компактно: «12 тыс.» / «1,2 млн» */
function formatCompactCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    const rounded =
      value >= 10
        ? String(Math.round(value))
        : value.toFixed(1).replace(".", ",");
    return `${rounded.replace(/,0$/, "")} млн`;
  }
  if (count >= 1_000) {
    return `${Math.round(count / 1_000)} тыс.`;
  }
  return count.toLocaleString("ru-RU");
}

function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const listenersLabel = computed(() => {
  const count = props.listenersCount;
  if (count <= 0) return "Нет слушателей";
  const formatted = formatCompactCount(count);
  return `${formatted} ${pluralRu(count, "слушатель", "слушателя", "слушателей")}`;
});

const hasListeners = computed(() => props.listenersCount > 0);

const hasAlbums = computed(() => props.albumCount > 0);

const albumsLabel = computed(() => {
  const count = props.albumCount;
  return `${count.toLocaleString("ru-RU")} ${pluralRu(count, "альбом", "альбома", "альбомов")}`;
});

const hasTracks = computed(() => props.trackCount > 0);

const tracksLabel = computed(() => {
  const count = props.trackCount;
  return `${count.toLocaleString("ru-RU")} ${pluralRu(count, "трек", "трека", "треков")}`;
});

const profileUrl = computed(() => {
  if (typeof window === "undefined") return `/user/${props.artistId}`;
  return `${window.location.origin}/user/${props.artistId}`;
});

const profileUrlLabel = computed(() => {
  try {
    const url = new URL(profileUrl.value);
    return `${url.host}${url.pathname}`;
  } catch {
    return profileUrl.value;
  }
});
</script>

<template>
  <ModalLayout :title="props.artistName" @close="onClose">
    <div
      class="flex w-[min(calc(100vw-4rem),24rem)] flex-col gap-8 sm:w-96"
    >
      <!-- Описание -->
      <section class="flex flex-col gap-3">
        <h3 class="text-base font-bold text-primary-white">Описание</h3>
        <p
          class="whitespace-pre-wrap text-sm leading-relaxed"
          :class="hasBio ? 'text-primary-white' : 'text-primary-gray'"
        >
          {{ bioDisplay }}
        </p>
      </section>

      <!-- Ссылки -->
      <section
        v-if="props.links.length"
        class="flex flex-col gap-3"
      >
        <h3 class="text-base font-bold text-primary-white">Ссылки</h3>
        <ul class="flex flex-col gap-4">
          <li
            v-for="link in props.links"
            :key="link.kind"
            class="flex flex-row items-start gap-3"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-black text-primary-white"
            >
              <component
                :is="LINK_ICONS[link.kind] ?? PhLink"
                :size="20"
                weight="light"
              />
            </div>
            <div class="min-w-0 flex flex-col gap-0.5">
              <span class="truncate text-sm font-semibold text-primary-white">
                {{ LINK_LABELS[link.kind] }}
              </span>
              <a
                :href="link.href"
                target="_blank"
                rel="noopener noreferrer"
                class="truncate text-sm text-primary-white hover:underline"
              >
                {{ linkHost(link.href) }}
              </a>
            </div>
          </li>
        </ul>
      </section>

      <!-- Доп. информация -->
      <section class="flex flex-col gap-3">
        <h3 class="text-base font-bold text-primary-white">
          Дополнительная информация
        </h3>
        <ul class="flex flex-col gap-3">
          <li class="flex flex-row items-center gap-3 text-sm text-primary-white">
            <PhLink :size="20" weight="light" class="shrink-0" />
            <a
              :href="profileUrl"
              class="min-w-0 truncate text-primary-white hover:underline"
            >
              {{ profileUrlLabel }}
            </a>
          </li>
          <li class="flex flex-row items-center gap-3 text-sm text-primary-white">
            <PhGlobe :size="20" weight="light" class="shrink-0" />
            <span>{{ props.country || "Россия" }}</span>
          </li>
          <li
            class="flex flex-row items-center gap-3 text-sm"
            :class="hasListeners ? 'text-primary-white' : 'text-primary-gray'"
          >
            <PhUser :size="20" weight="light" class="shrink-0" />
            <span>{{ listenersLabel }}</span>
          </li>
          <li
            class="flex flex-row items-center gap-3 text-sm"
            :class="hasAlbums ? 'text-primary-white' : 'text-primary-gray'"
          >
            <PhDisc :size="20" weight="light" class="shrink-0" />
            <span>{{ albumsLabel }}</span>
          </li>
          <li
            class="flex flex-row items-center gap-3 text-sm"
            :class="hasTracks ? 'text-primary-white' : 'text-primary-gray'"
          >
            <PhHeadphones :size="20" weight="light" class="shrink-0" />
            <span>{{ tracksLabel }}</span>
          </li>
        </ul>
      </section>
    </div>
  </ModalLayout>
</template>
