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
import { formatListenersLabel } from "~/utils/formatListenersLabel";
import { formatCountRu } from "~/utils/pluralizeRu";

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

const listenersLabel = computed(() => {
  const label = formatListenersLabel(props.listenersCount);
  return label ?? "Нет слушателей";
});

const hasListeners = computed(() => props.listenersCount > 0);

const hasAlbums = computed(() => props.albumCount > 0);

const albumsLabel = computed(() =>
  formatCountRu(props.albumCount, "альбом", "альбома", "альбомов"),
);

const hasTracks = computed(() => props.trackCount > 0);

const tracksLabel = computed(() =>
  formatCountRu(props.trackCount, "трек", "трека", "треков"),
);

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
    <div class="flex w-[min(100vw-4rem,24rem)] flex-col gap-6">
      <!-- Описание -->
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-bold text-tone-white">Описание</h3>
        <p
          class="whitespace-pre-wrap text-sm leading-relaxed"
          :class="hasBio ? 'text-tone-white' : 'text-tone-muted'"
        >
          {{ bioDisplay }}
        </p>
      </section>

      <!-- Ссылки -->
      <section v-if="props.links.length" class="flex flex-col gap-3">
        <h3 class="text-base font-bold text-tone-white">Ссылки</h3>
        <ul class="flex flex-col gap-1">
          <li v-for="link in props.links" :key="link.kind">
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-tone-surface-hover"
            >
              <div
                class="flex size-10 shrink-0 items-center justify-center rounded-full bg-tone-surface text-tone-white"
              >
                <component
                  :is="LINK_ICONS[link.kind] ?? PhLink"
                  :size="20"
                  weight="light"
                />
              </div>
              <div class="flex min-w-0 flex-col gap-0.5">
                <span class="truncate text-sm font-medium text-tone-white">
                  {{ LINK_LABELS[link.kind] }}
                </span>
                <span class="truncate text-sm text-tone-muted">
                  {{ linkHost(link.href) }}
                </span>
              </div>
            </a>
          </li>
        </ul>
      </section>

      <!-- Доп. информация -->
      <section class="flex flex-col gap-3">
        <h3 class="text-base font-bold text-tone-white">
          Дополнительная информация
        </h3>
        <ul class="flex flex-col gap-3">
          <li class="flex items-center gap-3 text-sm text-tone-white">
            <PhLink :size="20" weight="light" class="shrink-0 text-tone-muted" />
            <a
              :href="profileUrl"
              class="min-w-0 truncate transition-colors hover:text-tone-muted"
            >
              {{ profileUrlLabel }}
            </a>
          </li>
          <li class="flex items-center gap-3 text-sm text-tone-white">
            <PhGlobe
              :size="20"
              weight="light"
              class="shrink-0 text-tone-muted"
            />
            <span>{{ props.country || "Россия" }}</span>
          </li>
          <li
            class="flex items-center gap-3 text-sm"
            :class="hasListeners ? 'text-tone-white' : 'text-tone-muted'"
          >
            <PhUser
              :size="20"
              weight="light"
              class="shrink-0 text-tone-muted"
            />
            <span>{{ listenersLabel }}</span>
          </li>
          <li
            class="flex items-center gap-3 text-sm"
            :class="hasAlbums ? 'text-tone-white' : 'text-tone-muted'"
          >
            <PhDisc
              :size="20"
              weight="light"
              class="shrink-0 text-tone-muted"
            />
            <span>{{ albumsLabel }}</span>
          </li>
          <li
            class="flex items-center gap-3 text-sm"
            :class="hasTracks ? 'text-tone-white' : 'text-tone-muted'"
          >
            <PhHeadphones
              :size="20"
              weight="light"
              class="shrink-0 text-tone-muted"
            />
            <span>{{ tracksLabel }}</span>
          </li>
        </ul>
      </section>
    </div>
  </ModalLayout>
</template>
